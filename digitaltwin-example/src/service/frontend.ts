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
import * as Ajv from 'ajv'
import { AxiosInstance } from 'axios';

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const THING_ID: string = CONFIG.frontend.thingId
const POLICY_ID = THING_ID

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

  constructor(private readonly axiosInstance: AxiosInstance) {
  }

  async start() {
    console.log()
    console.log('[Frontend] start')

    await this.recreateEntities()

    setInterval(() => this.retrieveDeviceTwinState(), 3000)

    setInterval(() => this.retrieveSupportedAccessories(), 7000)

    setInterval(() => this.configureThreshold(), 15000)
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


    console.log('[Frontend] cleanup')
    await this.deprovisionDevice(THING_ID)
      .catch(e => console.log(`[Frontend] ignore failed cleanup: ${e.message}`))

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

    await this.provisionDevice(provisioningRequest)

    // extend policy

    console.log('[Frontend] read policy')
    let policy = await this.getPolicy(POLICY_ID)

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
    await this.updatePolicy(POLICY_ID, policy)
  }

  private configureThreshold(): Promise<void> {
    let threshold = 18 + Math.random() * 10

    console.log(`[Frontend] configureThreshold ${threshold}`)
    return this.axiosInstance.put(CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/config/threshold',
      `${threshold}`)
      .then(_ => console.log('[Frontend] configureThreshold successful'))
      .catch(e => console.log(`[Frontend] configureThreshold failed ${e}`))
  }

  private retrieveDeviceTwinState(): Promise<void> {
    return this.axiosInstance.get(CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/status')
      .then(response => console.log(`[Frontend] retrieveDeviceTwinState response: ${JSON.stringify(response.data)}`))
      .catch(e => console.log(`[Frontend] retrieveDeviceTwinState failed ${e}`))
  }

  private async retrieveSupportedAccessories(): Promise<any> {
    console.log('[Frontend] trigger retrieveSupportedAccessories')
    try {
      const response = await this.axiosInstance.post(CONFIG.httpBaseUrl + '/api/2/things/' + THING_ID +
        '/features/Accessories/inbox/messages/retrieveSupportedAccessories', {})
        .then(r => r.data)
      console.log(`[Frontend] retrieveSupportedAccessories response: ${JSON.stringify(response)}`)

      if (ACCESSORIES_RESPONSE_VALIDATION(response)) {
        console.log(`[Frontend] retrieveSupportedAccessories response valid`)
        return response
      } else {
        console.log(`[Frontend] retrieveSupportedAccessories response validation failed: ${JSON.stringify(ACCESSORIES_RESPONSE_VALIDATION.errors)}`)
      }
    } catch (e) {
      console.log(`[Frontend] retrieveSupportedAccessories failed ${e}`)
      console.log(this)
      console.log(this.axiosInstance)
      console.log(e)
    }
    return undefined
  }

  private provisionDevice(provisioningRequest: any): Promise<void> {
    return this.axiosInstance.post(CONFIG.provisioning.suiteProvisioningHttpBaseUrl + `/api/1/${CONFIG.provisioning.serviceInstanceId}/devices?skipVorto=true`,
      provisioningRequest);
  }
  private deprovisionDevice(deviceId: string): Promise<void> {
    return this.axiosInstance.delete(CONFIG.provisioning.suiteProvisioningHttpBaseUrl + `/api/1/${CONFIG.provisioning.serviceInstanceId}/devices/${deviceId}`)
  }
  private getPolicy(policyId: string): Promise<any> {
    return this.axiosInstance.get(CONFIG.httpBaseUrl + '/api/2/policies/' + policyId)
      .then(response => response.data);
  }
  private updatePolicy(policyId: string, policy: any): Promise<any> {
    return this.axiosInstance.put(CONFIG.httpBaseUrl + '/api/2/policies/' + policyId, policy);
  }

}
