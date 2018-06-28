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
import * as Ajv from 'ajv'
import { ThingMessage, ThingMessageInfo, Helpers } from './helpers'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.httpHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.deviceCommissioning.username + ':' + CONFIG.deviceCommissioning.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const JSON_SCHEMA_VALIDATOR = new Ajv({ schemaId: 'auto', allErrors: true })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

const COMMISSION_DEVICE_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/org.eclipse.ditto_HonoCommissioning_1.0.0/operations/commissionDevice.schema.json', 'utf8')))
const COMMISSION_GATEWAY_DEVICE_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/org.eclipse.ditto_HonoCommissioning_1.0.0/operations/commissionGatewayDevice.schema.json', 'utf8')))

/** Microservice implementation to support commissioning of a device to prepare the device connectivity.
 *
 * Implements http://vorto.eclipse.org/#/details/org.eclipse.ditto/HonoCommissioning/1.0.0 to register devices at Bosch IoT Hub / Eclipse Hono for usage with Bosch IoT Things / Eclispe Ditto.
 * The current implementation only includes these elements in commissioning but could be extended or be used as a template for more complex commissioning orchestrations.
 */

export class DeviceCommissioning {

  private ws?: NodeWebSocket

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log('[Commissioning] start')

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`Commissioning start timeout; pending acks: ${pendingAcks}`), 10000)

      // DEBUG
      // await this.commission({ thingId: 'abc:xxx', localThingId: 'xxx:', hubTenant: 'xxx', hubDevicePasswordHashed: 'xxx' })

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
                  console.log('[Commissioning] started')
                  resolve()
                }
              } else {
                console.log('[Commissioning] excessive ACK ignored: ' + data)
              }
            } else {
              console.log('[Commissioning] unprocessed non-json data: ' + data)
            }
          })

          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`[Commissioning] websocket send error ${err}`) })
        })
    })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'live' && m.criterion === 'messages'
      && m.path.startsWith('/features/Commissioning/inbox/messages/')) {

      const subject = m.path.substr('/features/Commissioning/inbox/messages/'.length)
      let input = m.value

      let processor: (p) => Promise<any>
      let validator: Ajv.ValidateFunction
      switch (subject) {
        case 'commissionDevice':
          processor = (p) => this.commissionDevice(p)
          validator = COMMISSION_DEVICE_VALIDATION
          // wrap single-parameter input in correct object
          input = { pwdHash: m.value }
          break
        case 'commissionGatewayDevice':
          processor = (p) => this.commissionGatewayDevice(p)
          validator = COMMISSION_GATEWAY_DEVICE_VALIDATION
          // wrap single-parameter input in correct object
          input = { optionalGatewayId: m.value }
          break
        default:
          processor = () => { throw new Error(`Unsupport message subject ${subject}`) }
          validator = () => true
      }

      if (validator(m.value)) {
        console.log(`[Commissioning] received valid request`)
      } else {
        console.log(`[Commissioning] request validation faild: ${JSON.stringify(validator.errors)}`)
        return
      }

      input = { ...input, thingId: m.thingId, localThingId: m.localThingId }

      Helpers.processWithResponse(m, processor, input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => console.log('[Commissioning] ' + (err ? 'websocket send error ' + err : 'websocket send response')))
      })
      return
    }

    console.log('[Commissioning] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private commissionDevice(p: { pwdHash: string, thingId: string, localThingId: string })
    : Promise<{ code: number, text?: string }> {

    console.log(`[Commissioning] commissiong device ${JSON.stringify({ ...p, ...{ pwdHash: 'xxx' } })} ${this}`)

    return this.commission(p.thingId, CONFIG.deviceCommissioning.hubTenant, p.localThingId, p.localThingId, p.pwdHash)
  }

  private commissionGatewayDevice(p: { optionalGatewayId: string, thingId: string, localThingId: string })
    : Promise<{ code: number, text?: string }> {

    console.log(`[Commissioning] commissiong gateway device ${JSON.stringify(p)}`)

    const gatewayId = p.optionalGatewayId || CONFIG.deviceCommissioning.hubGatewayId
    if (gatewayId !== CONFIG.deviceCommissioning.hubGatewayId) {
      throw new Error(`Gateway-Id ${p.optionalGatewayId} invalid; only ${CONFIG.deviceCommissioning.hubGatewayId} allowed`)
    }

    return this.commission(p.thingId, CONFIG.deviceCommissioning.hubTenant, p.localThingId, undefined, undefined, gatewayId)
  }

  private async commission(thingId, tenantId, deviceId, authId?, pwdHash?, viaGatewayId?)
    : Promise<{ code: number, text?: string }> {

    // ### Snippet for Dummy Commissioning
    // tslint:disable-next-line:no-constant-condition
    // if (1 > 0) return { code: 200, text: 'Dummy Commissioning OK' }

    // TODO include BASIC auth for Hub tenant as soon as required

    let cleanup: Array<() => void> = []

    // cleanup existing device+credentials

    // TODO check if this cleanup is a potential security risk to replace credentials

    if (authId) {
      cleanup.push(() => requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + encodeURIComponent(tenantId)
          + '?device-id=' + encodeURIComponent(deviceId)
          + '&auth-id=' + encodeURIComponent(authId)
          + '&type=' + 'hashed-password',
        method: 'DELETE',
        auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword }
      }))
    }
    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + encodeURIComponent(tenantId) + '/' + encodeURIComponent(deviceId),
      method: 'DELETE',
      auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword }
    }))
    console.log('[Commissioning] cleanup')
    await Helpers.processAll(cleanup, '[Commissioning] ignore failed cleanup')

    // register device

    console.log(`[Commissioning] register device ${tenantId} ${deviceId}`)
    const body: any = {
      'device-id': deviceId
    }
    if (viaGatewayId) {
      body.via = viaGatewayId
    }
    try {
      const rd = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/registration/' + encodeURIComponent(tenantId),
        method: 'POST',
        auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword },
        json: true,
        body: body,
        resolveWithFullResponse: true
      })
      console.log(`[Commissioning] result ${rd.statusCode} ${rd.headers.location}`)
    } catch (e) {
      console.log(`[Commissioning] register device failed ${e}`)
      throw e
    }

    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + encodeURIComponent(tenantId) + '/' + encodeURIComponent(deviceId),
      method: 'DELETE',
      auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword }
    }))

    // register credential

    if (authId && pwdHash) {
      try {
        console.log(`[Commissioning] register device credential ${tenantId} ${deviceId} ${authId}`)
        const rc = await requestPromise({
          url: 'https://device-registry.bosch-iot-hub.com/credentials/' + encodeURIComponent(tenantId),
          method: 'POST',
          auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword },
          json: true,
          body: {
            'device-id': deviceId,
            'auth-id': authId,
            'type': 'hashed-password',
            'secrets': [{
              'hash-function': 'sha-512',
              'pwd-hash': pwdHash
            }]
          },
          resolveWithFullResponse: true
        })
        console.log(`[Commissioning] credential result ${rc.statusCode} ${rc.headers.location}`)
      } catch (e) {
        await Helpers.processAll(cleanup, '[Commissioning] cleanup credential registration')
        throw e
      }

      cleanup.push(() => requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + encodeURIComponent(tenantId)
          + '?device-id=' + encodeURIComponent(deviceId)
          + '&auth-id=' + encodeURIComponent(authId)
          + '&type=' + 'hashed-password',
        method: 'DELETE',
        auth: { user: CONFIG.deviceCommissioning.hubRegistryUsername, pass: CONFIG.deviceCommissioning.hubRegistryPassword }
      }))
    }

    // update Commissioning feature in Thing

    try {
      let body: any = {
        status: {
          date: new Date(),
          tenantId: tenantId,
          deviceId: deviceId,
          authId: authId
        }
      }
      if (viaGatewayId) {
        body.status.gatewayId = viaGatewayId
      }

      await requestPromise({
        url: CONFIG.httpBaseUrl + '/api/2/things/' + thingId + '/features/Commissioning/properties',
        method: 'PUT',
        json: true,
        auth: { user: CONFIG.deviceCommissioning.username, pass: CONFIG.deviceCommissioning.password },
        headers: CONFIG.httpHeaders,
        body: body
      })
      console.log('[Commissioning] update commissioning info successful')
    } catch (e) {
      console.log(`[Commissioning] update commissioning info failed ${e}`)
      await Helpers.processAll(cleanup, '[Commissioning] ignore failed cleanup')
      throw e
    }

    return { code: 200, text: 'Hub Commissioning OK' }
  }

}
