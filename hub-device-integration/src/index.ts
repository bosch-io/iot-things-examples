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

import * as mqtt from 'mqtt'
import * as requestPromise from 'request-promise-native'
import * as shajs from 'sha.js'
import * as fs from 'fs'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const THING_ID = CONFIG.things.namespace + ':' + CONFIG.things.thingname
const POLICY_ID = THING_ID
const THINGS_HTTP_DEFAULT_OPTIONS = {
  json: true,
  auth: { username: CONFIG.things.username, password: CONFIG.things.password },
  headers: { 'x-cr-api-token': CONFIG.things.apitoken }
}

class HubDeviceIntegration {

  async start(): Promise<void> {
    await this.cleanup()
    await this.registerThing()
    await this.registerDevice()

    const PROPERTY_PATH = '/features/temperature/properties/status/sensorValue'

    const msg = {
      topic: CONFIG.things.namespace + '/' + CONFIG.things.thingname + '/things/twin/commands/modify',
      path: PROPERTY_PATH,
      value: 0,
      headers: { 'response-required': false }
    }

    try {
      msg.value = Math.random() * 20 + 10
      await this.sendDataMqtt(msg)
      await this.checkUpdate(PROPERTY_PATH, msg.value)
    } catch (e) {
      console.log(`ignored error in mqtt roundtrip: ${e}\n`)
    }

    try {
      msg.value = Math.random() * 20 + 10
      await this.sendDataHttp(msg)
      await this.checkUpdate(PROPERTY_PATH, msg.value)
    } catch (e) {
      console.log(`ignored error in http roundtrip: ${e}\n`)
    }
  }

  async registerThing() {

    const policy = {
      entries: {
        owner: {
          subjects: {
            '${request.subjectId}': { type: 'iot-permissions-userid' }
          },
          resources: {
            'thing:/': { grant: ['READ', 'WRITE'], revoke: [] },
            'message:/': { grant: ['READ', 'WRITE'], revoke: [] },
            'policy:/': { grant: ['READ', 'WRITE'], revoke: [] }
          }
        },
        hub: {
          subjects: {
            [CONFIG.things.authSubject]: { type: 'iot-things-integration' }
          },
          resources: {
            'thing:/features': { grant: ['WRITE'], revoke: [] },
            'message:/': { grant: ['WRITE'], revoke: [] }
          }
        }
      }
    }

    const thing = {
      policyId: POLICY_ID,
      features: {
        temperature: {
        }
      }
    }

    await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
      url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/policies/' + POLICY_ID,
      method: 'PUT',
      body: policy
    }))

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await this.sleep(2000)

    try {
      await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
        url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/things/' + THING_ID,
        method: 'PUT',
        body: thing
      }))
    } catch (err) {
      // in case of errors: delete unwanted policy again
      await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
        url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/policies/' + POLICY_ID,
        method: 'DELETE'
      }))
    }

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await this.sleep(2000)

    console.log('policy + thing registered')
  }

  async registerDevice(): Promise<void> {

    await requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + CONFIG.hub.tenant,
      method: 'POST',
      json: true,
      auth: { user: CONFIG.hub.registryUsername, pass: CONFIG.hub.registryPassword },
      body: {
        'device-id': CONFIG.hub.deviceId
      },
      resolveWithFullResponse: true
    })

    const devicePasswordHashed = shajs('sha512').update(CONFIG.hub.devicePassword).digest('base64')

    try {
      await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + CONFIG.hub.tenant,
        method: 'POST',
        json: true,
        auth: { user: CONFIG.hub.registryUsername, pass: CONFIG.hub.registryPassword },
        body: {
          'device-id': CONFIG.hub.deviceId,
          'auth-id': CONFIG.hub.deviceAuthId,
          'type': 'hashed-password',
          'secrets': [{
            'hash-function': 'sha-512',
            'pwd-hash': devicePasswordHashed
          }]
        }
      })
    } catch (err) {
      // in case of errors: delete unwanted device again
      await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/registration/' + CONFIG.hub.tenant + '/' + CONFIG.hub.deviceId,
        auth: { user: CONFIG.hub.registryUsername, pass: CONFIG.hub.registryPassword },
        method: 'DELETE'
      })
    }

    console.log('device + device credentials registered\n')
  }

  async sendDataMqtt(msg): Promise<void> {

    return new Promise<void>((resolve, reject) => {
      console.log('trying mqtt connection')

      const mqttClient = mqtt.connect('mqtts://mqtt.bosch-iot-hub.com:8883', {
        clientId: CONFIG.hub.deviceId,
        rejectUnauthorized: false,
        username: CONFIG.hub.deviceAuthId + '@' + CONFIG.hub.tenant,
        password: CONFIG.hub.devicePassword
      } as mqtt.IClientOptions)

      setTimeout(() => { mqttClient.end(); reject('mqtt timeout') }, 5000)

      mqttClient.on('error', reject)
      mqttClient.on('connect', function () {
        console.log('mqtt connected')

        mqttClient.publish('telemetry/' + CONFIG.hub.tenant + '/' + CONFIG.hub.deviceId, JSON.stringify(msg), { qos: 0 },
          (err) => {
            // either way: immediatly shutdown client after publish
            mqttClient.end()

            if (err) {
              reject(err)
            } else {
              console.log(`successfully sent telemtry data over mqtt`)
              resolve()
            }
          })
      })

    })
  }

  async sendDataHttp(msg): Promise<void> {

    await requestPromise({
      url: 'https://rest.bosch-iot-hub.com/telemetry/' + CONFIG.hub.tenant + '/' + CONFIG.hub.deviceId,
      auth: { user: CONFIG.hub.deviceAuthId + '@' + CONFIG.hub.tenant, pass: CONFIG.hub.devicePassword },
      method: 'PUT',
      json: true,
      body: msg
    })

    console.log(`successfully sent telemtry data over http`)
  }

  async checkUpdate(path: string, referenceValue: any): Promise<void> {

    // wait for some time ...
    await this.sleep(2000)

    // receive value from twin
    let result = await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
      url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/things/' + THING_ID + path,
      method: 'GET'
    }))
    let resultObj = JSON.parse(result)

    if (referenceValue === resultObj) {
      console.log('twin value is updated correctly\n')
    } else {
      throw new Error('twin value is not successfully updated (yet)')
    }

  }

  // cleanup (delete) existing device/thing for proper re-registration
  async cleanup(): Promise<void> {

    try {
      const r = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + CONFIG.hub.tenant
          + '?device-id=' + CONFIG.hub.deviceId + '&auth-id=' + CONFIG.hub.deviceAuthId + '&type=' + 'hashed-password',
        method: 'DELETE',
        auth: { user: CONFIG.hub.registryUsername, pass: CONFIG.hub.registryPassword }
      })
      console.log(`cleanup: delete device credential done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete device credential: ${err}`)
    }

    try {
      const r = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/registration/' + CONFIG.hub.tenant + '/' + CONFIG.hub.deviceId,
        method: 'DELETE',
        auth: { user: CONFIG.hub.registryUsername, pass: CONFIG.hub.registryPassword }
      })
      console.log(`cleanup: delete device done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete device: ${err}`)
    }

    try {
      const r = await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
        url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/things/' + THING_ID,
        method: 'DELETE'
      }))
      console.log(`cleanup: delete thing done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete thing: ${err}`)
    }

    try {
      const r = await requestPromise(Object.assign({}, THINGS_HTTP_DEFAULT_OPTIONS, {
        url: 'https://things.s-apps.de1.bosch-iot-cloud.com/api/2/policies/' + POLICY_ID,
        method: 'DELETE'
      }))
      console.log(`cleanup: delete policy done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete policy: ${err}`)
    }

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await this.sleep(2000)

    console.log()
  }

  private async sleep(milliseconds): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
  }

}

console.log('\nstarting ...\n')
new HubDeviceIntegration().start().then(() => console.log('done'), (e) => console.log(`failed: ${e}`))
