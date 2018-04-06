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

const WEBSOCKET_REOPEN_TIMEOUT = 5000

/**
 * Historian service that listens to thing signals via WebSocket and either pushes them as measurements to an InfluxDB or executes queries.
 */
export class Historian {

  private config: Config
  private ws?: NodeWebSocket

  private websocketOptions

  constructor(config: Config) {
    this.config = config
    this.websocketOptions = {
      agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
      headers: {
        ...this.config.httpHeaders,
        'Authorization': 'Basic ' + new Buffer(this.config.things.username + ':' + this.config.things.password).toString('base64')
      }
    }
  }

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log(`start for user ${this.config.things.username}`)

      // WARNING: use this only for testing - if your InfluxDB instance uses a self-signed certificate
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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
                  console.log(`started for user ${this.config.things.username}`)
                  resolve()
                }
              } else {
                console.log('excessive ACK ignored: ' + data)
              }
            } else {
              console.log('unprocessed non-json data: ' + data)
            }
          })

          this.ws.send('START-SEND-EVENTS', (err) => { pendingAcks.push('START-SEND-EVENTS:ACK'); if (err) console.log(`websocket send error ${err}`) })
          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`websocket send error ${err}`) })
        })
    })
  }

  private async process(m: ThingMessage) {

    if (m.channel === 'twin' && m.criterion === 'events' && m.action === 'modified'
      && m.path.startsWith('/features')) {

      this.processModification(m.thingId, m.path, m.value)
      return
    }

    if (m.channel === 'live' && m.criterion === 'messages'
      && m.path.startsWith('/features/') && m.path.endsWith('/inbox/messages/historianQuery')) {

      const input = { ...m.value, thingId: m.thingId }

      Helpers.processWithResponse(m, (p) => this.historianQuery(p), input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => console.log('[HistorianQuery] ' + (err ? 'websocket send error ' + err : 'websocket send response')))
      })
      return
    }

    // console.log('unprocessed data: ' + m.topic + ' ' + m.thingId)
  }

  /** Pushes modifications as InfluxDB measurements. */
  private async processModification(thingId: string, path: string, value: any) {
    const modifiedThing = Helpers.partial(path, value)
    const data = this.collectMeasurements(modifiedThing.features, thingId)

    if (data) {
      console.log(`thing ${thingId} modified: ${JSON.stringify(modifiedThing)}`)

      let r = requestPromise({
        url: this.config.influxdb.write.url,
        method: 'POST',
        auth: { sendImmediately: true, user: this.config.influxdb.write.username, pass: this.config.influxdb.write.password },
        json: false,
        resolveWithFullResponse: true,
        body: data
      } as requestPromise.Options)
      try {
        await r
      } catch (e) {
        console.log(`write error ${e.toString()} ${JSON.stringify(r)}`)
      }
    }
  }

  private collectMeasurements(obj: any, id: string, parentpath: string | undefined = undefined): string {
    let r = ''
    for (let prop in obj) {
      const value = obj[prop]
      const path = parentpath ? parentpath + '.' + prop : prop
      if (typeof value === 'number') {
        if (!this.config.influxdb.write.ignoreProperties || this.config.influxdb.write.ignoreProperties.indexOf(prop) < 0) {
          const shortenedPath = path.replace('.properties.', '.')
          // append InfluxDB write line
          r += `${shortenedPath},id=${id} value=${value}\n`
        }
      } else if (typeof value === 'object') {
        r += this.collectMeasurements(value, id, path)
      }
    }
    return r
  }

  /** Execute InfluxDB query scoped to the provided thingId */
  private async historianQuery(p: { thingId: string, from: string, fields: string, where: string, groupBy: string, orderBy: string, limit: string })
    : Promise<string> {

    if (!p.from) {
      return JSON.stringify({ statusCode: 400, error: '"from" required' })
    }
    if (p.from.trim().startsWith('(')) {
      return JSON.stringify({ statusCode: 400, error: 'subqueries not allowed' })
    }

    let q = 'SELECT ' + (p.fields ? p.fields : '*')
      + ' FROM ' + p.from
      + ' WHERE (id = \'' + p.thingId + '\')' + (p.where ? ' AND (' + p.where + ')' : '')
      + (p.groupBy ? ' GROUP BY ' + p.groupBy : '')
      + (p.orderBy ? ' ORDER BY ' + p.orderBy : '')

    console.log(`InfluxDB query: ${q}`)

    let r = requestPromise({
      url: this.config.influxdb.read.url + encodeURI(q),
      method: 'GET',
      auth: { sendImmediately: true, user: this.config.influxdb.read.username, pass: this.config.influxdb.read.password },
      resolveWithFullResponse: true
    } as requestPromise.Options)
    try {
      let o = await r
      return o.body
    } catch (e) {
      console.log(`InfluxDB query error ${e.toString()}`)
      return JSON.stringify({ statusCode: e.statusCode, error: e.error })
    }
  }

}
