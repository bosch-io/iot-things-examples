/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2017 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 * following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * BOSCH SI PROVIDES THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 */

/* Copyright (c) 2018 Bosch Software Innovations GmbH, Germany. All rights reserved. */

import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
import * as requestPromise from 'request-promise-native'
import { ThingMessage, ThingMessageInfo, Helpers } from './helpers'
import { Config } from './config'

const WEBSOCKET_REOPEN_TIMEOUT = 15000

/**
 * Forwarder service that listens to thing signals via WebSocket and pushes them as normalized JSON documents to an extern HTTP endpoint.
 * The JSON documents are normalized, but sparse, i.e. contain only modified values but with the full structure to these modifications.
 */
export class Forwarder {

  private config: Config
  private ws?: NodeWebSocket
  private websocketOptions
  private countForwards: number = 0
  private countForwardsNamespaces = {}

  constructor(config: Config) {
    this.config = config
    this.websocketOptions = {
      agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
      headers: {
        ...this.config.httpHeaders,
        'Authorization': 'Basic ' + Buffer.from(this.config.things.username + ':' + this.config.things.password).toString('base64')
      }
    }
  }

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      this.log(`starting...`)

      // WARNING: use the following only for testing - if your target http endpoint uses a self-signed certificate
      // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`start timeout; pending acks: ${pendingAcks}`), 10000)

      Helpers.openWebSocket(this.config.websocketBaseUrl + '/ws/2', this.websocketOptions, WEBSOCKET_REOPEN_TIMEOUT,
        (ws) => {
          this.ws = ws

          this.ws.on('message', (data) => {
            const dataString = data.toString()
            if (dataString.startsWith('{')) {
              this.process(new ThingMessage(JSON.parse(dataString) as ThingMessageInfo))
            } else if (dataString.startsWith('START-SEND-') && dataString.endsWith(':ACK')) {
              let i = pendingAcks.indexOf(dataString)
              if (i > -1) {
                pendingAcks.splice(i, 1)
                if (pendingAcks.length === 0) {
                  this.log(`started`)
                  resolve()
                }
              } else {
                this.log(`excessive ACK ignored: ${data}`)
              }
            } else {
              this.log(`unprocessed non-json data: ${data}`)
            }
          })

          this.ws.send('START-SEND-EVENTS', (err) => { pendingAcks.push('START-SEND-EVENTS:ACK'); if (err) this.log(`websocket send error ${err}`) })
          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) this.log(`websocket send error ${err}`) })
        })
    })
  }

  private async process(m: ThingMessage) {

    if (m.channel === 'twin' && m.criterion === 'events' && m.action === 'modified') {

      this.forward(m)
      return
    }

    // this.log(`unprocessed data: ${m.topic} ${m.thingId}`)
  }

  /** Pushes modifications to external http endpoint. */
  private async forward(m: ThingMessage) {

    const partialThing = Helpers.partial(m.path, m.value)
    partialThing.thingId = m.thingId
    partialThing._modified = new Date()
    partialThing._context = {
      topic: m.topic,
      path: m.path,
      headers: m.headers,
      fields: m.fields,
      status: m.status
    }

    // this.log(`thing ${m.thingId} modified: ${JSON.stringify(partialThing)}`)

    let r = requestPromise({
      url: this.config.forwarder.url,
      method: 'POST',
      auth: { sendImmediately: true, user: this.config.forwarder.username, pass: this.config.forwarder.password },
      json: true,
      resolveWithFullResponse: true,
      body: partialThing,
      headers: {
        'X-Metadata': `thingId\=${m.thingId}`
      }
    } as requestPromise.Options)
    try {
      await r
    } catch (e) {
      this.log(`write error ${e.toString()} ${JSON.stringify(r)}`)
    }

    this.countForwardsNamespaces[m.namespace] = (this.countForwardsNamespaces[m.namespace] + 1) || 1
    this.countForwards++
    if (this.countForwards === 1 || this.countForwards % 100 === 0) {
      this.log(`forwarded ${this.countForwards} thing modifications in total; latest namespaces: ${JSON.stringify(this.countForwardsNamespaces)}`)
      this.countForwardsNamespaces = {}
    }
  }

  private log(m): void {
    console.log(`${new Date().toISOString()} ${this.config.things.username}: ${m}`)
  }

}
