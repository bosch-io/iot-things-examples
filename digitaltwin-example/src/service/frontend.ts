/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2017 Bosch Software Innovations GmbH ('Bosch SI'). All rights reserved.
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
 * BOSCH SI PROVIDES THE PROGRAM 'AS IS' WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
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
import * as requestPromise from 'request-promise-native'
import * as Ajv from 'ajv'
import { Helpers } from './helpers'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const THING_ID: string = CONFIG.frontend.thingId
const POLICY_ID = THING_ID

const DEFAULT_OPTIONS: requestPromise.RequestPromiseOptions = {
  json: true,
  auth: { user: CONFIG.frontend.username, pass: CONFIG.frontend.password },
  headers: CONFIG.httpHeaders
}

const JSON_SCHEMA_VALIDATOR = new Ajv({ schemaId: 'auto', allErrors: true })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

const ACCESSORIES_RESPONSE_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/com.bosch.iot.suite.examples.digitaltwin_Accessories_2.0.0/operations/retrieveSupportedAccessories-response.schema.json', 'utf8')))

/** Example frontend of an IoT application using Digital Twins.
 *
 * The implementation shows the following examplinary topics:
 *  - set up a Thing entity with its Policy to define the digital twin
 *  - setup the device connectivity
 *  - periodically sets a configuration value (that should be used by the device)
 *  - periodically retrieves supported accessories (as orchestratet business logic usable in the context of this digital twin)
 *  - periodically reads the whole state of the digital twin.
 */

export class Frontend {

  async start() {
    console.log()
    console.log('[Frontend] start')

    await this.recreateEntities()

    setInterval(await this.retrieveDeviceTwinState, 3000)

    setInterval(await this.retrieveSupportedAccessories, 7000)

    setInterval(await this.configureThreshold, 15000)
  }

  private async recreateEntities() {

    const thing = {
      definition: 'com.bosch.iot.suite.examples.digitaltwin:DigitaltwinExample:1.0.0',
      attributes: {
        commissioningDate: new Date()
      },
      features: {
        Device: {
          definition: ['com.bosch.iot.suite.examples.digitaltwin:D100:2.1.0'],
          properties: {
            config: {
              threshold: 11
            },
            status: {
            }
          }
        },
        Description: {
          definition: ['com.bosch.iot.suite.standard:Descriptive:1.0.0'],
          properties: {
            config: {
              displayName: 'My D100A device'
            }
          }
        },
        Productinfo: {
          properties: {
            config: {
              model: 'D100A',
              manufacturer: 'ACME'
            }
          }
        },
        Accessories: {
          definition: ['com.bosch.iot.suite.examples.digitaltwin:Accessories:2.0.0']
        }
      }
    }

    let cleanup: Array<() => void> = []

    // get oauth token

    console.log('[Frontend] get oauth token')
    let r = await requestPromise({
      url: CONFIG.provisioning.oauthTokenEndpoint,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      form: {
        grant_type: 'client_credentials',
        client_id: CONFIG.provisioning.oauthClientId,
        client_secret: CONFIG.provisioning.oauthClientSecret,
        scope: `service:iot-hub-prod:${CONFIG.provisioning.hubTenantId}/full-access service:iot-things-eu-1:${CONFIG.provisioning.thingsServiceInstanceId}/full-access`
      }
    })
    const accessToken = JSON.parse(r).access_token
    // console.log(`[Frontend] oauth accessToken:\n${accessToken}\n`)

    // delete old Thing / Policy
    // TODO switch to DELETE of Suite Device Provisioning

    cleanup.push(async () => {
      try {
        await requestPromise({
          auth: { bearer: accessToken },
          url: CONFIG.httpBaseUrl + '/api/2/policies/' + encodeURIComponent(THING_ID),
          headers: { 'if-none-match': '*' },
          json: true,
          body: {
            entries: {
              DEFAULT: {
                subjects: { '{{ request:subjectId }}': { type: 'any' } },
                resources: {
                  'policy:/': { grant: ['READ', 'WRITE'], revoke: [] },
                  'thing:/': { grant: ['READ', 'WRITE'], revoke: [] },
                  'message:/': { grant: ['READ', 'WRITE'], revoke: [] }
                }
              }
            }
          },
          method: 'PUT'
        })
      } catch (e) {
        // ignore completely
      }
      // await Helpers.sleep(2000)
    })
    cleanup.push(() => requestPromise({
      auth: { bearer: accessToken },
      url: CONFIG.httpBaseUrl + '/api/2/things/' + encodeURIComponent(THING_ID),
      method: 'DELETE'
    }))
    cleanup.push(() => requestPromise({
      auth: { bearer: accessToken },
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + encodeURIComponent(POLICY_ID),
      method: 'DELETE'
    }))
    cleanup.push(() => requestPromise({
      auth: { bearer: accessToken },
      url: `${CONFIG.provisioning.cleanup.hubDeviceRegistryHttpBaseUrl}/registration/${encodeURIComponent(CONFIG.provisioning.hubTenantId)}/${encodeURIComponent(THING_ID)}`,
      method: 'DELETE'
    }))
    const hubAuthId = THING_ID.replace(':', '_')
    cleanup.push(() => requestPromise({
      auth: { bearer: accessToken },
      url: `${CONFIG.provisioning.cleanup.hubDeviceRegistryHttpBaseUrl}/credentials/${encodeURIComponent(CONFIG.provisioning.hubTenantId)}?auth-id=${encodeURIComponent(hubAuthId)}&type=hashed-password`,
      method: 'DELETE'
    }))

    console.log('[Frontend] cleanup')
    await Helpers.processAll(cleanup, '[Frontend] ignore failed cleanup')

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await Helpers.sleep(2000)

    // provision thing+device (incl. policy+credentials)

    console.log('\n[Frontend] provision thing+device')

    const provisioningRequest = {
      id: THING_ID,
      hub: {
        device: { enabled: true },
        credentials: {
          type: 'hashed-password',
          secrets: [
            {
              password: CONFIG.provisioning.hubDevicePassword
            }
          ]
        }
      },
      things: {
        thing: thing
      }
    }

    // console.log('<-- ' + JSON.stringify(provisioningRequest))

    await requestPromise({
      json: true,
      auth: { bearer: accessToken },
      url: CONFIG.provisioning.suiteProvisioningHttpBaseUrl + `/api/1/${CONFIG.provisioning.serviceInstanceId}/devices?skipVorto=true`,
      method: 'POST',
      body: provisioningRequest
    })

    // extend policy

    console.log('[Frontend] read policy')
    let policy = await requestPromise({
      auth: { bearer: accessToken },
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'GET',
      json: true
    })

    policy.entries.DEFAULT.subjects[CONFIG.frontend.subject] = { type: 'iot-permissions-user' }
    policy.entries.DEVICE.subjects[CONFIG.deviceSimulation.subject] = { type: 'iot-permissions-user' }
    delete policy.entries.DEVICE.resources['message:/']
    policy.entries.ACCESSORIES = {
      subjects: {
        [CONFIG.accessories.subject]: { type: 'iot-permissions-user' }
      },
      resources: {
        'message:/features/Accessories/inbox/messages': {
          grant: ['READ', 'WRITE'],
          revoke: []
        },
        'thing:/features/Productinfo': {
          grant: ['READ'],
          revoke: []
        }
      }
    }

    console.log('[Frontend] write extended policy')
    await requestPromise({
      auth: { bearer: accessToken },
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + POLICY_ID,
      body: policy,
      json: true,
      method: 'PUT'
    })

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await Helpers.sleep(1000)

  }

  private async configureThreshold() {
    let threshold = 18 + Math.random() * 10

    console.log(`[Frontend] configureThreshold ${threshold}`)
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/config/threshold',
      method: 'PUT',
      body: threshold
    }
    try {
      await requestPromise(options)
      console.log('[Frontend] configureThreshold successful')
    } catch (e) {
      console.log(`[Frontend] configureThreshold failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

  private async retrieveDeviceTwinState() {
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/status',
      method: 'GET'
    }
    try {
      const state = await requestPromise(options)
      console.log(`[Frontend] retrieveDeviceTwinState response: ${JSON.stringify(state)}`)
    } catch (e) {
      console.log(`[Frontend] retrieveDeviceTwinState failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

  private async retrieveSupportedAccessories(): Promise<any> {
    console.log('[Frontend] trigger retrieveSupportedAccessories')
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Accessories/inbox/messages/retrieveSupportedAccessories',
      method: 'POST',
      body: {}
    }
    try {
      const response = await requestPromise(options)
      console.log(`[Frontend] retrieveSupportedAccessories response: ${JSON.stringify(response)}`)

      if (ACCESSORIES_RESPONSE_VALIDATION(response)) {
        console.log(`[Frontend] retrieveSupportedAccessories response valid`)
        return response
      } else {
        console.log(`[Frontend] retrieveSupportedAccessories response validation faild: ${JSON.stringify(ACCESSORIES_RESPONSE_VALIDATION.errors)}`)
      }
    } catch (e) {
      console.log(`[Frontend] retrieveSupportedAccessories failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
    return undefined
  }

}
