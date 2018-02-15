// import * as express from 'express'
import * as fs from 'fs'
import * as requestPromise from 'request-promise-native'
import * as shajs from 'sha.js'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const THING_ID = CONFIG.frontend.thingId
const POLICY_ID = CONFIG.frontend.policyId
const HUB_TENANT = CONFIG.frontend.hubTenant
const HUB_DEVICE_PASSWORD = CONFIG.frontend.hubDevicePassword

const DEFAULT_OPTIONS: requestPromise.RequestPromiseOptions = {
  json: true,
  auth: { user: CONFIG.frontend.username, pass: CONFIG.frontend.password },
  headers: { 'x-cr-api-token': CONFIG.frontend.apitoken }
}

export class Frontend {
  // express: any

  constructor() {
    // this.express = express()
  }

  async start(): Promise<void> {
    console.log()
    console.log('[Frontend] start')

    await this.recreateEntities()
    await this.commission()

    setInterval(await this.retrieveDeviceTwinState, 3000)

    setInterval(await this.retrieveSupportedAccessories, 7000)

    setInterval(await this.configureThreshold, 15000)

    // this.express.listen(8080, (err: any) => {
    //   if (err) {
    //     return console.log('Frontend] ' + err)
    //   }
    //   return console.log(`[Frontend] listening on 8080`)
    // })
    // this.mountRoutes()
  }

  // private mountRoutes(): void {
  //   const router = express.Router()
  //   router.get('/', (req, res) => {
  //   })
  //   this.express.use('/', router)
  // }

  async recreateEntities() {

    const thing = {
      policyId: POLICY_ID,
      attributes: {
        commissioningDate: new Date()
      },
      features: {
        Device: {
          properties: {
            definition: ['com.acme:D100:2.1.0'],
            config: {
              threshold: 11
            },
            status: {
            }
          }
        },
        Commissioning: {
          properties: {
            definition: ['org.ditto:HonoCommissioning:1.0.0']
          }
        },
        Description: {
          properties: {
            definition: ['org.eclipse.vorto.standard:Descriptive:1.0.0'],
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
          properties: {
            definition: ['com.bosch.catalog:Accessories:2.0.0'],
            xyz: 123
          }
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
          subjects: {}, // will be set programmatically further down
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
          subjects: {}, // will be set programmatically further down
          resources: {
            'thing:/features/Accessories': {
              grant: ['READ', 'WRITE'],
              revoke: []
            },
            'message:/features/Accessories/inbox/messages': {
              grant: ['READ', 'WRITE'],
              revoke: []
            }
          }
        },
        commissiong: {
          subjects: {}, // will be set programmatically further down
          resources: {
            'message:/features/Commissioning/inbox/messages/commission': {
              grant: ['READ'],
              revoke: []
            }
          }
        }
      }
    }

    policy.entries.device.subjects[CONFIG.deviceSimulation.subject] = { type: 'any' }
    policy.entries.accessories.subjects[CONFIG.accessories.subject] = { type: 'any' }
    policy.entries.commissiong.subjects[CONFIG.deviceCommissioning.subject] = { type: 'any' }

    let cleanup: Array<() => void> = []

    // delete old Thing / Policy

    // #####################################

    // cleanup.push(() => requestPromise({
    //   ...DEFAULT_OPTIONS,
    //   url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID,
    //   method: 'DELETE'
    // }))
    // cleanup.push(() => requestPromise({
    //   ...DEFAULT_OPTIONS,
    //   url: CONFIG.frontend.baseUrl + '/api/2/policies/' + POLICY_ID,
    //   method: 'DELETE'
    // }))

    // console.log('[Frontend] cleanup')
    // cleanup.forEach(async (f, i, a) => {
    //   try {
    //     await f()
    //   } catch (e) {
    //     console.log(`[Frontend] ignore failed cleanup ${e}`)
    //   }
    //   a.splice(i)
    // })

    // create Policy

    console.log('[Frontend] create/update policy')
    await requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'PUT',
      body: policy
    })

    cleanup.push(() => requestPromise({
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/policies/' + POLICY_ID,
      method: 'DELETE'
    }))

    // create Thing

    try {
      console.log('[Frontend] create/update thing')
      await requestPromise({
        ...DEFAULT_OPTIONS,
        url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID,
        method: 'PUT',
        body: thing
      })
    } catch (e) {
      cleanup.forEach((f, i, a) => { f(); a.splice(i) })
    }

  }

  async commission() {
    console.log('[Frontend] trigger commission')

    const commissionRequest = {
      hubTenant: HUB_TENANT,
      hubDevicePasswordHashed: shajs('sha512').update(HUB_DEVICE_PASSWORD).digest('base64')
    }

    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID + '/features/Commissioning/inbox/messages/commission',
      method: 'POST',
      json: true,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        'content-type': 'application/json'
      },
      body: commissionRequest
    }

    try {
      const response = await requestPromise(options)
      console.log(`[Frontend] commissioning response: ${JSON.stringify(response)}`)
    } catch (e) {
      console.log(`[Frontend] commissioning failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

  async configureThreshold() {
    let threshold = 18 + Math.random() * 10
    console.log(`[Frontend] configureThreshold ${threshold}`)
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/config/threshold',
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

  async retrieveDeviceTwinState() {
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID + '/features/Device/properties/status',
      method: 'GET'
    }
    try {
      const state = await requestPromise(options)
      console.log(`[Frontend] retrieveDeviceTwinState response: ${JSON.stringify(state)}`)
    } catch (e) {
      console.log(`[Frontend] retrieveDeviceTwinState failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

  async retrieveSupportedAccessories() {
    console.log('[Frontend] trigger retrieveSupportedAccessories')
    const options = {
      ...DEFAULT_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/things/' + THING_ID + '/features/Accessories/inbox/messages/retrieveSupportedAccessories',
      method: 'POST',
      body: {}
    }
    try {
      const response = await requestPromise(options)
      console.log(`[Frontend] retrieveSupportedAccessories response: ${JSON.stringify(response)}`)
    } catch (e) {
      console.log(`[Frontend] retrieveSupportedAccessories failed ${e} ${JSON.stringify({ ...options, auth: { ...options.auth, pass: 'xxx' } })}`)
    }
  }

}
