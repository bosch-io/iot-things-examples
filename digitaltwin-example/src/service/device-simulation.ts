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
import { setInterval } from 'timers'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.httpHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.deviceSimulation.username + ':' + CONFIG.deviceSimulation.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const THING_ID: string = CONFIG.frontend.thingId
const THING_ID_PATH = THING_ID.replace(':', '/')
const HUB_TENANT = CONFIG.deviceCommissioning.hubTenant
const HUB_DEVICE_ID = THING_ID.substr(THING_ID.indexOf(':') + 1)
const HUB_DEVICE_AUTH_ID = HUB_DEVICE_ID
const HUB_DEVICE_PASSWORD = CONFIG.frontend.hubDevicePassword

/** Simple device simulation that simulates device activity in absence of a real phyiscal device.
 *
 * It periodically sends a temperature value and accepts configuration changes of a threshold value.
 *
 * The device simulation currently uses the Bosch IoT Hub / Eclipse Hono HTTP channel to emit telemetry data
 * AND in parallel the Bosch IoT Things / Eclipse Ditto WebSocket channel to receive configuration changes.
 * The WebSocket channel is not proposed for large scale scenarios with high number of device connections
 * but should be replaced by an appropriate device connectivity channel.
 * As soon as both Bosch IoT Hub / Eclipse Hono and Bosch IoT Things / Eclipse Ditto support an integrated command&control
 * (see https://www.eclipse.org/hono/api/command-and-control-api/) pattern using MQTT, the simulation could be switched to it
 * for both channels.
 */

export class DeviceSimulation {

  private ws?: NodeWebSocket

  private status: {
    temperature?: number
  } = {}

  private config: {
    threshold?: number
  } = {}

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log('[DeviceSimulation] start')

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`DeviceSimulation start timeout; pending acks: ${pendingAcks}`), 10000)

      Helpers.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
        (ws) => {
          this.ws = ws

          setTimeout(() => setInterval(() => this.updateStatus(), 4000), 10000)

          this.ws.on('message', (data) => {
            const dataString = data.toString()
            if (dataString.startsWith('{')) {
              this.process(new ThingMessage(JSON.parse(dataString) as ThingMessageInfo))
            } else if (dataString.startsWith('START-SEND-') && dataString.endsWith(':ACK')) {
              let i = pendingAcks.indexOf(dataString)
              if (i > -1) {
                pendingAcks.splice(i, 1)
                if (pendingAcks.length === 0) {
                  console.log('[DeviceSimulation] started')
                  resolve()
                }
              } else {
                console.log('[DeviceSimulation] excessive ACK ignored: ' + data)
              }
            } else {
              console.log('[DeviceSimulation] unprocessed non-json data: ' + data)
            }
          })

          this.ws.send('START-SEND-EVENTS', (err) => { pendingAcks.push('START-SEND-EVENTS:ACK'); if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
          this.ws.send('START-SEND-LIVE-COMMANDS', (err) => { pendingAcks.push('START-SEND-LIVE-COMMANDS:ACK'); if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
          this.ws.send('START-SEND-LIVE-EVENTS', (err) => { pendingAcks.push('START-SEND-LIVE-EVENTS:ACK'); if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
        })
    })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'twin' && m.criterion === 'events' && m.action === 'modified'
      && m.path.startsWith('/features/Device/properties/config')) {

      if (THING_ID === m.thingId) {
        const t = Helpers.partial(m.path, m.value)
        if (t.features.Device.properties.config.threshold) {
          this.config.threshold = t.features.Device.properties.config.threshold
          console.log('[DeviceSimulation] new threshold: ' + this.config.threshold)
          return
        }
      }
    }

    console.log('[DeviceSimulation] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private async updateStatus() {
    this.status.temperature = 18 + Math.random() * 10

    if (!this.config.threshold || this.status.temperature > this.config.threshold) {
      console.log(`[DeviceSimulation] send relevant temperature update: ${this.status.temperature}`)

      const update: ThingMessage = new ThingMessage({
        topic: THING_ID_PATH + '/things/twin/commands/modify',
        path: '/features/Device/properties/status',
        value: this.status,
        headers: { 'response-required': false /*, 'correlation-id': '123'*/ }
      })

      // publish update to Hub via HTTP
      const options = {
        url: 'https://rest.bosch-iot-hub.com/telemetry/' + HUB_TENANT + '/' + HUB_DEVICE_ID,
        auth: { username: HUB_DEVICE_AUTH_ID + '@' + HUB_TENANT, password: HUB_DEVICE_PASSWORD },
        method: 'PUT',
        json: true,
        body: update
      }
      try {
        await requestPromise(options)
      } catch (e) {
        console.log(`[DeviceSimulation] send update ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
      }

      // ### alternativly: publich directly to Things via WebSocket
      // this.ws!.send(JSON.stringify(update), (err) => { if (err) console.log('[DeviceSimulation] updateStatus websocket send error ' + err) })
    }
  }

}
