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
import * as uuidv4 from 'uuid/v4'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'
import { util } from '../util/util'
import { setInterval } from 'timers'
import { Config } from './config'

const WEBSOCKET_REOPEN_TIMEOUT = 1000

/**
 * Simulation of the processing required on a device/gateway that supports to be configured from the backend and reports status values.
 * The simulation includes online and offline behavior where offline support is based on a synchroinization between reported and desired configuration state.
 */
export class DeviceSimulation {

  private ws?: NodeWebSocket
  private correlationHandlers = new Map<string, (m: ThingMessage) => void>()

  private simulateOfflineCounter = 0

  private status: {
    temperature?: number
  } = {}

  private config: {
    threshold?: number
  } = {}

  private websocketOptions = {
    agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
    headers: {
      ...this.serviceConfig.httpHeaders,
      'Authorization': 'Basic ' + new Buffer(this.serviceConfig.username + ':' + this.serviceConfig.password).toString('base64')
    }
  }

  constructor(private serviceConfig: Config) { }

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log(`[DeviceSimulation] start for user ${this.serviceConfig.username}`)

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`[DeviceSimulation] start timeout; pending acks: ${pendingAcks}`), 10000)

      util.openWebSocket(this.serviceConfig.websocketBaseUrl + '/ws/2', this.websocketOptions, WEBSOCKET_REOPEN_TIMEOUT,
        (ws) => {
          this.ws = ws

          // send status values periodically
          setTimeout(() => setInterval(() => this.updateStatus(), 4000), 10000)

          // trigger synchronization periodically
          setTimeout(() => setInterval(() => this.synchronize(), 10000), 5000)

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

                  // TODO: call this.synchronize() on re-connect; currently called periodically (s.a.)
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

    // handle correlated reponses via registered handler
    let correlationId = m.headers['correlation-id']
    if (correlationId) {
      let handler = this.correlationHandlers.get(correlationId)
      if (handler) {
        this.correlationHandlers.delete(correlationId)
        handler(m)
        return
      }
    }

    // receive config directly by handling creates/modifications on @desired features
    if (m.channel === 'twin' && m.criterion === 'events' && (m.action === 'modified' || m.action === 'created')) {
      const t = util.partial(m.path, m.value)

      if (t.features
        && t.features['Device@desired']
        && t.features['Device@desired'].properties
        && t.features['Device@desired'].properties.config
        && t.features['Device@desired'].properties.config.threshold) {

        console.log('[DeviceSimulation] new threshold from twin event: %s %s', m.thingId, t.features['Device@desired'].properties.config.threshold)

        // simulate device online-offline toggeling; 5 times offline, 5 times online
        this.simulateOfflineCounter = (this.simulateOfflineCounter + 1) % 10
        if (this.simulateOfflineCounter >= 5) {
          console.log('[DeviceSimulation] simulated skip of event ("device offline") (%s/10)', this.simulateOfflineCounter)
          return
        } else {
          console.log('[DeviceSimulation] simulated acceptance of event ("device online") (%s/10)', this.simulateOfflineCounter)
        }

        this.modifyThreshold(m.namespace, m.localThingId, t.features['Device@desired'].properties.config.threshold)

        return
      }
    }

    // console.log('[DeviceSimulation] unprocessed data: %s -> (%s) path: %s value: %s', m.topic, m.status, m.path, JSON.stringify(m.value))
  }

  private synchronize() {

    // receive config indirectly by requesting patch of reported features compared to @desired features

    const thingId = this.serviceConfig.thingId
    const namespace = thingId.substr(0, thingId.indexOf(':'))
    const localThingId = thingId.substr(thingId.indexOf(':') + 1)
    const correlationId = 'sync-' + uuidv4()

    const msg = new ThingMessage({
      topic: namespace + '/' + localThingId + '/things/live/messages/determineDesiredPatch',
      headers: {
        'thing-id': thingId,
        'content-type': 'text/plain',
        subject: 'determineDesiredPatch',
        direction: 'FROM',
        'correlation-id': correlationId
      },
      path: '/inbox/messages/determineDesiredPatch',
      value: ''
    })
    // console.log('[DeviceSimulation] request determineDesiredPatch with message %s', msg.toJSONString())

    // prepare handler timeout
    const timer = setTimeout(() => {
      this.correlationHandlers.delete(correlationId)
      console.log('[DeviceSimulation] request determineDesiredPatch timed out')
    }, 10000)

    // register response handler
    this.correlationHandlers.set(correlationId, m => {
      clearTimeout(timer)

      // console.log('[DeviceSimulation] determineDesiredPatch response received: ' + JSON.stringify(m.value))

      // look at all patch commands
      let patch: any[] = m.value
      for (let i = 0; i < patch.length; i++) {
        let p = patch[i]

        if ((p.op === 'add' || p.op === 'replace')) {
          const t = util.partial(p.path, p.value)

          // check if add/replace patch contains new config
          if (t.Device
            && t.Device.properties
            && t.Device.properties.config
            && t.Device.properties.config.threshold) {

            console.log('[DeviceSimulation] new threshold from determineDesiredPatch: %s %s', thingId, t.Device.properties.config.threshold)
            this.modifyThreshold(namespace, localThingId, t.Device.properties.config.threshold)
            break
          }
        }

        console.log('[DeviceSimulation] unprocessed patch ' + JSON.stringify(p))
      }
    })

    this.ws!.send(msg.toJSONString(), (err) => { if (err) console.log('[DeviceSimulation] updateStatus websocket send error ' + err) })
  }

  private async modifyThreshold(namespace, localThingId, newThreshold) {

    this.config.threshold = newThreshold

    // confirm by sending config into reported Feature (without "@desired")

    const update: ThingMessage = new ThingMessage({
      topic: namespace + '/' + localThingId + '/things/twin/commands/modify',
      path: '/features/Device/properties/config/threshold',
      value: this.config.threshold,
      headers: { 'response-required': false }
    })
    console.log('[DeviceSimulation] confirm with message to path: %s', update.path)

    this.ws!.send(update.toJSONString(), (err) => { if (err) console.log('[DeviceSimulation] updateStatus websocket send error ' + err) })
  }

  private async updateStatus() {
    this.status.temperature = 18 + Math.random() * 10

    if (!this.config.threshold || this.status.temperature > this.config.threshold) {
      console.log(`[DeviceSimulation] send relevant temperature update: ${this.status.temperature}`)

      const thingId = this.serviceConfig.thingId
      const namespace = thingId.substr(0, thingId.indexOf(':'))
      const localThingId = thingId.substr(thingId.indexOf(':') + 1)

      const update: ThingMessage = new ThingMessage({
        topic: namespace + '/' + localThingId + '/things/twin/commands/modify',
        path: '/features/Device/properties/status',
        value: this.status,
        headers: { 'response-required': false /*, 'correlation-id': '123'*/ }
      })

      this.ws!.send(JSON.stringify(update), (err) => { if (err) console.log('[DeviceSimulation] updateStatus websocket send error ' + err) })
    }
  }

}
