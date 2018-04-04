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

import * as requestPromise from 'request-promise-native'
import { Config } from './service/config'
import { util } from './util/util'

/**
 * Example frontend of an IoT application.
 * Set's up a Thing entity, periodically tries to set a desired configuration value and also periodically reads the whole state (reported and desired).
 */

export class Frontend {

  private readonly defaultOptions: requestPromise.RequestPromiseOptions = {
    json: true,
    auth: { user: this.config.username, pass: this.config.password },
    headers: this.config.httpHeaders
  }

  constructor(private config: Config) { }

  async start() {
    console.log()
    console.log(`[Frontend] start for user ${this.config.username}`)

    await this.recreateEntities()

    setInterval(await (() => this.retrieveDeviceTwinState()), 3000)
    setInterval(await (() => this.configureThreshold()), 25000)
  }

  private async recreateEntities() {

    const thing = {
      policyId: this.config.policyId,
      features: {
        Device: {
          definition: ['com.acme.device:D100:2.1.0'],
          properties: {
            status: {
            }
          }
        },
        'Device@desired': {
          definition: ['com.acme.device:D100:2.1.0'],
          properties: {
            config: {
              threshold: 99
            }
          }
        }
      }
    }

    const policy = {
      entries: {
        owner: {
          subjects: {
            [this.config.subject]: { type: 'any' }
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
        synchronizer: {
          subjects: {
            [this.config.subject]: { type: 'any' }
          },
          resources: {
            'thing:/features/Device/properties': {
              grant: ['READ'],
              revoke: []
            },
            'thing:/features/Device@desired/properties': {
              grant: ['WRITE'],
              revoke: []
            },
            'message:/inbox/messages/determineDesiredPatch': {
              grant: ['READ'],
              revoke: []
            }
          }
        },
        simulation: {
          subjects: {
            [this.config.subject]: { type: 'any' }
          },
          resources: {
            'thing:/features/Device/properties/status': {
              grant: ['WRITE'],
              revoke: []
            },
            'thing:/features/Device@desired/properties/config': {
              grant: ['READ'],
              revoke: []
            },
            'message:/inbox/messages/determineDesiredPatch': {
              grant: ['WRITE'],
              revoke: []
            }
          }
        }
      }
    }

    let cleanup: Array<() => void> = []

    // delete old Thing / Policy

    cleanup.push(() => {
      console.log('[Frontend] ...cleanup thing')
      return requestPromise({
        ...this.defaultOptions,
        url: this.config.httpBaseUrl + '/api/2/things/' + this.config.thingId,
        method: 'DELETE'
      })
    })
    cleanup.push(async () => {
      console.log('[Frontend] ...cleanup policy')
      await util.sleep(2000)
      return requestPromise({
        ...this.defaultOptions,
        url: this.config.httpBaseUrl + '/api/2/policies/' + this.config.policyId,
        method: 'DELETE'
      })
    })

    console.log('[Frontend] cleanup')
    await util.processAll(cleanup, '[Frontend] ignore failed cleanup')
    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(5000)

    // create Policy

    console.log('[Frontend] create policy %s', this.config.policyId)
    await requestPromise({
      ...this.defaultOptions,
      url: this.config.httpBaseUrl + '/api/2/policies/' + this.config.policyId,
      method: 'PUT',
      body: policy
    })

    cleanup.push(() => requestPromise({
      ...this.defaultOptions,
      url: this.config.httpBaseUrl + '/api/2/policies/' + this.config.policyId,
      method: 'DELETE'
    }))

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(2000)

    // create Thing

    try {
      console.log('[Frontend] create thing %s', this.config.thingId)
      await requestPromise({
        ...this.defaultOptions,
        url: this.config.httpBaseUrl + '/api/2/things/' + this.config.thingId,
        method: 'PUT',
        body: thing
      })
    } catch (e) {
      await util.processAll(cleanup, '[Frontend] ignore failed create/update thing cleanup')
      throw e
    }

    // wait some time as prior operation could take a bit to be visible everywhere in a CAP-theorem-driven world
    await util.sleep(10000)
  }

  private async configureThreshold() {
    let threshold = 18 + Math.random() * 10

    console.log(`[Frontend] configureThreshold ${threshold}`)
    const options = {
      ...this.defaultOptions,
      url: this.config.httpBaseUrl + '/api/2/things/' + this.config.thingId
        + '/features/Device@desired/properties/config/threshold',
      method: 'PUT',
      body: threshold
    }
    try {
      await requestPromise(options)
    } catch (e) {
      console.log(`[Frontend] configureThreshold failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

  private async retrieveDeviceTwinState() {
    const options = {
      ...this.defaultOptions,
      url: this.config.httpBaseUrl + '/api/2/things/' + this.config.thingId + '/features',
      method: 'GET'
    }
    try {
      const state = await requestPromise(options)
      console.log(`[Frontend] Thing: ${JSON.stringify(state)}`)
    } catch (e) {
      console.log(`[Frontend] retrieveDeviceTwinState failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

}
