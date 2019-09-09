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

import * as fs from 'fs'
import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
import * as requestPromise from 'request-promise-native'
import { ThingMessage, ThingMessageInfo, Helpers } from './helpers'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.httpHeaders,
    'Authorization': 'Basic ' + Buffer.from(CONFIG.accessories.username + ':' + CONFIG.accessories.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const REQUEST_OPTIONS: requestPromise.RequestPromiseOptions = {
  json: true,
  auth: { user: CONFIG.accessories.username, pass: CONFIG.accessories.password },
  headers: CONFIG.httpHeaders
}

/** Microservice to provide a custom functionality to determine supported accessory products.
 *
 * By knowning the context of the digital twin it determines accessories that can be combined with the device
 * (e.g. batteries, spare parts).
 * In real-world scenarios this business functionality could be retrieved from a product catalog system (e.g. via SAP).
 */

export class Accessories {

  private ws?: NodeWebSocket

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log('[Accessories] start')

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`Accessories start timeout; pending acks: ${pendingAcks}`), 10000)

      Helpers.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
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
                  console.log('[Accessories] started')
                  resolve()
                }
              } else {
                console.log('[Accessories] excessive ACK ignored: ' + data)
              }
            } else {
              console.log('[Accessories] unprocessed non-json data: ' + data)
            }
          })

          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`[Accessories] websocket send error ${err}`) })
        })
    })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'live' && m.criterion === 'messages'
      && m.path.startsWith('/features/Accessories/inbox/messages/')) {

      const subject = m.path.substr('/features/Accessories/inbox/messages/'.length)

      const input = { ...m.value, thingId: m.thingId, localThingId: m.localThingId }
      console.log(`[Accessories] received request ${subject}`)

      let processor = (p: any): Promise<any> => { throw new Error(`Unsupport message subject ${subject}`) }
      switch (subject) {
        case 'retrieveSupportedAccessories': processor = this.retrieveSupportedAccessories
      }

      Helpers.processWithResponse(m, processor, input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => console.log('[Accessories] ' + (err ? 'websocket send error ' + err : 'websocket send response ok')))
      })
      return
    }

    console.log('[Accessories] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private async retrieveSupportedAccessories(p: { thingId, localThingId })
    : Promise<Array<{ name: string, manufacturer: string, gtin: string }>> {

    const productinfo = await requestPromise({
      ...REQUEST_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + p.thingId + '/features/Productinfo/properties/config',
      method: 'GET'
    })
    console.log(`[Accessories] lookup product info: ${JSON.stringify(productinfo)}`)

    if (productinfo.model === 'D100A' && productinfo.manufacturer === 'ACME') {
      return [
        { name: 'Recharger', manufacturer: 'ACME', gtin: '12345678' },
        { name: 'Bag', manufacturer: 'Binford', gtin: '12345678901234' }
      ]
    } else {
      return []
    }
  }

}
