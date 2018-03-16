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
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'
import { util } from '../util/util'
import { CONFIG } from './config'

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.httpHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.things.username + ':' + CONFIG.things.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

/**
 * History collector service that listens to thing modifications via WebSocket and pushes them as measurements to an InfluxDB.
 */
export class HistoryCollector {

  private ws?: NodeWebSocket

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log('start')

      // if your InfluxDB instance uses a self-signed certificate
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`start timeout; pending acks: ${pendingAcks}`), 10000)

      util.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
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
                  console.log('started')
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
        })
    })
  }

  private async process(m: ThingMessage) {

    if (m.channel === 'twin' && m.criterion === 'events' && m.action === 'modified'
      && m.path.startsWith('/features')) {

      const modifiedThing = util.partial(m.path, m.value)
      const data = this.collectMeasurements(modifiedThing.features, m.thingId)

      if (data) {
        console.log(`thing ${m.thingId} modified: ${JSON.stringify(modifiedThing)}`)

        let r = requestPromise({
          url: CONFIG.influxdb.writeUrl,
          method: 'POST',
          auth: { sendImmediately: true, user: CONFIG.influxdb.username, pass: CONFIG.influxdb.password },
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

      return
    }

    // console.log('unprocessed data: ' + m.topic + ' ' + m.thingId)
  }

  private collectMeasurements(obj: any, id: string, parentpath: string | undefined = undefined): string {
    let r = ''
    for (let prop in obj) {
      const value = obj[prop]
      const path = parentpath ? parentpath + '.' + prop : prop
      if (typeof value === 'number') {
        if (!CONFIG.influxdb.ignoreProperties || CONFIG.influxdb.ignoreProperties.indexOf(prop) < 0) {
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

}
