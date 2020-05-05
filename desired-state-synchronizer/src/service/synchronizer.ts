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
import { ThingMessage, ThingMessageInfo, Helpers } from './helpers'
import { Config } from './config'
import { compare as jsonCompare } from 'fast-json-patch'
import { SuiteAuthService } from './suite-auth-service'
import { AxiosInstance } from 'axios'

/**
 * Synchronizer service that supports determining "patches" to reach "desired" state.
 * The patch is calculated as difference between desired and reported state.
 * The service listens to "determineDesiredPatch" messages on Things via WebSocket and responds with calculated patch.
 */
export class Synchronizer {

  private config: Config
  private ws?: NodeWebSocket

  constructor(config: Config, private readonly suiteAuthService: SuiteAuthService, private readonly axiosInstance: AxiosInstance) {
    this.config = config
  }

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log(`[Synchronizer] starting`)

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      const startTimeout = setTimeout(() => reject(`[Synchronizer] start timeout; pending acks: ${pendingAcks}`), 10000)
      this.suiteAuthService.createWebSocket(this.config.websocketBaseUrl + '/ws/2', (ws) => {
        clearTimeout(startTimeout)
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
                console.log(`[Synchronizer] started`)
                resolve()
              }
            } else {
              console.log('[Synchronizer] excessive ACK ignored: ' + data)
            }
          } else {
            console.log('[Synchronizer] unprocessed non-json data: ' + data)
          }
        })

        this.ws.send('START-SEND-EVENTS', (err) => { pendingAcks.push('START-SEND-EVENTS:ACK'); if (err) console.log(`[Synchronizer] websocket send error ${err}`) })
        this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`[Synchronizer] websocket send error ${err}`) })
      })
    })
  }

  private async process(m: ThingMessage) {

    if (m.channel === 'live' && m.criterion === 'messages' && m.path === '/inbox/messages/determineDesiredPatch') {
      const input = { ...m.value, thingId: m.thingId }

      Helpers.processWithResponse(m, (p) => this.determineDesiredPatch(p), input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => { if (err) console.log('[Synchronizer] websocket send error ' + err) })
      })
      return
    }

    // console.log('[Synchronizer] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path)
  }

  /** Determine patch to reach "desired" state by calculating difference between desired and reported state. */
  private async determineDesiredPatch(p: { thingId: string }): Promise<any> {

    console.log('[Synchronizer] request determineDesiredPatch received %s', p.thingId)

    try {
      const features = await this.getFeatures(p.thingId)
      // console.log('[Synchronizer] full features: ' + JSON.stringify(features, null, 2))

      // build compare objects for each perspective (desired/reported) with same feature ids
      const desired = {}
      const reported = {}
      for (let f in features) {
        // if it is a @desired feature then put respective feature content with same id in compare objects
        if (f.endsWith('@desired')) {
          let reportedFeatureId = f.substring(0, f.length - '@desired'.length)
          desired[reportedFeatureId] = features[f]
          reported[reportedFeatureId] = features[reportedFeatureId]

          // hard-coded: ignore "properties.status" - as this normally contains status properties not wanted to be sent back to device!
          delete reported[reportedFeatureId].properties.status
        }
      }

      // calculate json patch between two perspectives
      let result = jsonCompare(reported, desired)
      console.log('[Synchronizer] determineDesiredPatch response %s', JSON.stringify(result))
      return result
    } catch (e) {
      let result = { statusCode: e.statusCode, error: e.error }
      console.log('[Synchronizer] determineDesiredPatch response error %s', JSON.stringify(result))
      return result
    }
  }

  private getFeatures(thingId: string): Promise<any> {
    return this.axiosInstance.get(`${this.config.httpBaseUrl}/api/2/things/${thingId}/features`)
      .then(response => response.data)
  }

}
