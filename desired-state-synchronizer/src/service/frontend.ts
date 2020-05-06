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

import { Config } from './config'
import { AxiosInstance } from 'axios'

/** Example frontend of an IoT application.
 *
 * Set's up a Thing entity, periodically tries to set a desired configuration value and also periodically reads the whole state (reported and desired).
 */

export class Frontend {

  constructor(private readonly config: Config,
              private readonly axiosInstance: AxiosInstance) {
  }

  async start() {
    console.log()
    console.log(`[Frontend] starting`)

    await this.recreateEntities()

    setInterval(() => this.retrieveDeviceTwinState(), 3000)
    setInterval(() => this.configureThreshold(), 25000)
  }

  private createSubjects(): { [authSubject: string]: { type: string } } {
    return this.config.oauth.scope.split(/\s+/g)
      .map(scp => `${this.config.oauth.subjectIssuer}:${scp}`)
      .map(authSubject => ({ [authSubject]: { type: 'generated-in-example' } }))
      .reduce((prev, curr) => ({ ...prev, ...curr }))
  }

  private async recreateEntities() {
    const subjects = this.createSubjects()

    const thing = {
      policyId: this.config.policyId,
      features: {
        Device: {
          definition: ['com.acme.device:D100:2.1.0'],
          properties: {
            status: {}
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
          subjects,
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
          subjects,
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
          subjects,
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

    await Promise.resolve()
      .then(_ => {
        console.log('[Frontend] ...cleanup thing')
        return this.deleteThing(this.config.thingId)
      })
      .catch(e => console.log(`[Frontend] ignore failed cleanup: ${JSON.stringify(e.error || e)}`))
      .then(_ => {
        console.log('[Frontend] ...cleanup policy')
        return this.deletePolicy(this.config.policyId)
      })
      .catch(e => console.log(`[Frontend] ignore failed cleanup: ${JSON.stringify(e.error || e)}`))

    // create Policy
    console.log('[Frontend] create policy %s', this.config.policyId)
    await this.createPolicy(this.config.policyId, policy)

    // create Thing
    await this.createThing(this.config.thingId, thing)
      .catch(e => {
        this.deletePolicy(this.config.policyId)
          .catch(er => console.log(`[Frontend] ignore failed cleanup: ${JSON.stringify(er.error || er)}`))
        throw e
      })
  }

  private configureThreshold(): Promise<any> {
    let threshold = 18 + Math.random() * 10

    console.log(`[Frontend] configureThreshold ${threshold}`)
    return this.axiosInstance.put(this.config.httpBaseUrl + '/api/2/things/' + this.config.thingId
      + '/features/Device@desired/properties/config/threshold', `${threshold}`)
      .catch(e => console.log(`[Frontend] configureThreshold failed ${e}`))
  }

  private retrieveDeviceTwinState(): Promise<void> {
    return this.getFeatures(this.config.thingId)
      .then(thing => console.log(`[Frontend] Thing: ${JSON.stringify(thing)}`))
      .catch(e => console.log(`[Frontend] retrieveDeviceTwinState failed ${e}`))
  }

  private deleteThing(thingId: string): Promise<any> {
    return this.axiosInstance.delete(`${this.config.httpBaseUrl}/api/2/things/${thingId}`)
  }

  private deletePolicy(policyId: string): Promise<any> {
    return this.axiosInstance.delete(`${this.config.httpBaseUrl}/api/2/policies/${policyId}`)
  }

  private createPolicy(policyId: string, policy: any): Promise<any> {
    return this.axiosInstance.put(`${this.config.httpBaseUrl}/api/2/policies/${policyId}`, policy)
  }

  private createThing(thingId: string, thing: any): Promise<any> {
    return this.axiosInstance.put(`${this.config.httpBaseUrl}/api/2/things/${thingId}`, thing)
  }

  private getFeatures(thingId: string): Promise<any> {
    return this.axiosInstance.get(`${this.config.httpBaseUrl}/api/2/things/${thingId}/features`)
      .then(response => response.data)
  }

}
