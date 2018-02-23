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

import * as fs from 'fs'
import * as requestPromise from 'request-promise-native'
import * as shajs from 'sha.js'
import * as Ajv from 'ajv'
import { util } from '../util/util'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const THING_ID = CONFIG.frontend.thingId
const POLICY_ID = CONFIG.frontend.policyId

const DEFAULT_OPTIONS: requestPromise.RequestPromiseOptions = {
  json: true,
  auth: { user: CONFIG.frontend.username, pass: CONFIG.frontend.password },
  headers: CONFIG.httpHeaders
}

const JSON_SCHEMA_VALIDATOR = new Ajv({ schemaId: 'auto', allErrors: true })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

const ACCESSORIES_RESPONSE_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/com.acme.catalog_Accessories_2.0.0/operations/retrieveSupportedAccessories-response.schema.json', 'utf8')))
const COMMISSION_RESPONSE_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/org.eclipse.ditto_HonoCommissioning_1.0.0/operations/commissionDevice-response.schema.json', 'utf8')))

export class Frontend {

  async start() {
    console.log()
    console.log('[Frontend] start')

    await this.recreateEntities()
    await this.commission()

    setInterval(await this.retrieveDeviceTwinState, 3000)

    setInterval(await this.retrieveSupportedAccessories, 7000)

    setInterval(await this.configureThreshold, 15000)
  }

  private async recreateEntities() {

    const thing = {
      policyId: POLICY_ID,
      attributes: {
        commissioningDate: new Date()
      },
      features: {
        Device: {
          definition: ['com.acme.device:D100:2.1.0'],
          properties: {
            config: {
              threshold: 11
            },
            status: {
            }
          }
        },
        Commissioning: {
          definition: ['org.eclipse.ditto:HonoCommissioning:1.0.0']
        },
        Description: {
          definition: ['org.eclipse.vorto.standard:Descriptive:1.0.0'],
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
          definition: ['com.acme.catalog:Accessories:2.0.0']
        }
      }
    }

    const policy = {
      entries: {
        owner: {
          subjects: {
            '${request.subjectId}': { type: 'any' }
          },
          resources: {
            'thing:/': {
              grant: ['READ', 'WRITE'],
              revoke: []
            },
            'message:/': {
              grant: ['READ', 'WRITE'],
              revoke: []
            },
            'policy:/': {
              grant: ['READ', 'WRITE'],
              revoke: []
            }
          }
        },
        device: {
          subjects: {
            [CONFIG.deviceSimulation.subject]: { type: 'any' },
            [CONFIG.frontend.hubThingsIntegrationSubject]: { type: 'any' }
          },
          resources: {
            'thing:/features/Device/properties/status': {
              grant: ['WRITE'],
              revoke: []
            },
            'thing:/features/Device/properties/config': {
              grant: ['READ'],
              revoke: []
            }
          }
        },
        accessories: {
          subjects: {
            [CONFIG.accessories.subject]: { type: 'any' }
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
        },
        commissioning: {
          subjects: {
            [CONFIG.deviceCommissioning.subject]: { type: 'any' }
          },
          resources: {
            'message:/features/Commissioning/inbox/messages': {
              grant: ['READ'],
              revoke: []
            },
            'thing:/features/Commissioning': {
              grant: ['READ', 'WRITE'],
              revoke: []
            }
          }
        }
      }
    }

    let cleanup: Array<() => void> = []

    // delete old Thing / Policy

    cleanup.push(() => requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID,
      method: 'DELETE'
    }))
    cleanup.push(() => requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'DELETE'
    }))

    console.log('[Frontend] cleanup')
    await util.processAll(cleanup, '[Frontend] ignore failed cleanup')
    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(2000)

    // create Policy

    console.log('[Frontend] create/update policy')
    await requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'PUT',
      body: policy
    })

    cleanup.push(() => requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'DELETE'
    }))

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(1000)

    // create Thing

    try {
      console.log('[Frontend] create/update thing')
      await requestPromise({
        ...DEFAULT_OPTIONS,
        url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID,
        method: 'PUT',
        body: thing
      })
    } catch (e) {
      await util.processAll(cleanup, '[Frontend] ignore failed create/update thing cleanup')
      throw e
    }

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(1000)
  }

  private async commission() {
    console.log('[Frontend] trigger commission')

    // request body is pwdHash as literal; should be object with pwdHash property if more parameters are added
    const body = shajs('sha512').update(CONFIG.frontend.hubDevicePassword).digest('base64')

    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Commissioning/inbox/messages/commissionDevice',
      method: 'POST',
      json: true,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        'content-type': 'application/json'
      },
      body: body
    }

    try {
      const response = await requestPromise(options)
      console.log(`[Frontend] commissioning response: ${JSON.stringify(response)}`)

      if (COMMISSION_RESPONSE_VALIDATION(response)) {
        console.log(`[Frontend] commissioning response valid`)
        return response
      } else {
        console.log(`[Frontend] commissioning response validation faild: ${JSON.stringify(COMMISSION_RESPONSE_VALIDATION.errors)}`)
      }
    } catch (e) {
      console.log(`[Frontend] commissioning failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
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
