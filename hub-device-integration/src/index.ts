import * as mqtt from 'mqtt'
import * as requestPromise from 'request-promise-native'
import * as shajs from 'sha.js'

// !!! Your configuration/credentials for Bosch IoT Things
const THINGS_NAMESPACE = 'xxx'
const THINGS_LOCAL_THING_ID = 'xxx'
const THINGS_USERNAME = 'xxx'
const THINGS_PASSWORD = 'xxx!'
const THINGS_API_TOKEN = 'xxx'

// Authorization subject used for integration with Bosch IoT Hub
// see https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:006_message:007_protocol_bindings:amqp10_binding
const THINGS_HUB_SUBJECT = 'iot-things:xxx'

// !!! Your configuration/credentials for Bosch IoT Hub
const HUB_TENANT = THINGS_NAMESPACE
const HUB_DEVICE_ID = THINGS_LOCAL_THING_ID
const HUB_DEVICE_AUTH_ID = HUB_DEVICE_ID
const HUB_DEVICE_PASSWORD = 'xxx'

// Other constants (do not change)
const THING_ID = THINGS_NAMESPACE + ':' + THINGS_LOCAL_THING_ID
const POLICY_ID = THING_ID

const THINGS_HTTP_DEFAULT_OPTIONS = {
  json: true,
  auth: { username: THINGS_USERNAME, password: THINGS_PASSWORD },
  headers: { 'x-cr-api-token': THINGS_API_TOKEN }
}

class HubDeviceIntegration {

  async start(): Promise<void> {
    await this.cleanup()
    await this.registerThing()
    await this.registerDeviceConnection()

    const msg = {
      topic: HUB_TENANT + '/' + HUB_DEVICE_ID + '/things/twin/commands/modify',
      path: '/features/temperature/properties/status/sensorValue',
      value: 0,
      headers: { 'response-required': false }
    }

    msg.value = Math.random() * 20 + 10
    await this.sendDataHttp(msg)

    msg.value = Math.random() * 20 + 10
    await this.sendDataMqtt(msg)
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
          subjects: {}, // will be set programmatically further down
          resources: {
            'thing:/features': { grant: ['WRITE'], revoke: [] },
            'message:/': { grant: ['WRITE'], revoke: [] }
          }
        }
      }
    }
    policy.entries.hub.subjects[THINGS_HUB_SUBJECT] = { type: 'iot-things-clientid' }

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

    console.log('policy + thing registered')
  }

  async registerDeviceConnection(): Promise<void> {

    await requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + HUB_TENANT,
      method: 'POST',
      json: true,
      body: {
        'device-id': HUB_DEVICE_ID
      }
    })

    const devicePasswordHashed = shajs('sha512').update(HUB_DEVICE_PASSWORD).digest('base64')

    try {
      await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + HUB_TENANT,
        method: 'POST',
        json: true,
        body: {
          'device-id': HUB_DEVICE_ID,
          'auth-id': HUB_DEVICE_AUTH_ID,
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
        url: 'https://device-registry.bosch-iot-hub.com/registration/' + HUB_TENANT + '/' + HUB_DEVICE_ID,
        method: 'DELETE'
      })
    }

    console.log('device connection + device credentials registered\n')
  }

  async sendDataMqtt(msg): Promise<void> {

    return new Promise<void>((resolve, reject) => {
      console.log('trying mqtt connection')

      const mqttClient = mqtt.connect('mqtts://mqtt.bosch-iot-hub.com:8883', {
        clientId: HUB_DEVICE_ID,
        rejectUnauthorized: false,
        username: HUB_DEVICE_AUTH_ID + '@' + HUB_TENANT,
        password: HUB_DEVICE_PASSWORD
      } as mqtt.IClientOptions)

      setTimeout(() => { mqttClient.end(); reject('mqtt timeout') }, 5000)

      mqttClient.on('error', reject)
      mqttClient.on('connect', function () {
        console.log('mqtt connected')

        mqttClient.publish('telemetry/' + HUB_TENANT + '/' + HUB_DEVICE_ID, JSON.stringify(msg), { qos: 0 },
          (err) => {
            // either way: immediatly shutdown client after publish
            mqttClient.end()

            if (err) {
              reject(err)
            } else {
              console.log(`successfully sent telemtry data over mqtt\n`)
              resolve()
            }
          })
      })

    })
  }

  async sendDataHttp(msg): Promise<void> {

    const r = await requestPromise({
      url: 'https://rest.bosch-iot-hub.com/telemetry/' + HUB_TENANT + '/' + HUB_DEVICE_ID,
      auth: { username: HUB_DEVICE_AUTH_ID + '@' + HUB_TENANT, password: HUB_DEVICE_PASSWORD },
      method: 'PUT',
      json: true,
      body: msg
    })

    console.log(`successfully sent telemtry data over http; result ${r}\n`)
  }

  // cleanup (delete) existing device/thing for proper re-registration
  async cleanup(): Promise<void> {

    try {
      const r = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + HUB_TENANT
          + '?device-id=X' + HUB_DEVICE_ID + '&auth-id=' + HUB_DEVICE_AUTH_ID + '&type=' + 'hashed-password',
        method: 'DELETE'
        // auth: { username: username, password: password }
      })
      console.log(`cleanup: delete device credential done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete device credential: ${err}`)
    }

    try {
      const r = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/registration/' + HUB_TENANT + '/' + HUB_DEVICE_ID,
        method: 'DELETE'
      })
      console.log(`cleanup: delete device connection done; ${r}`)
    } catch (err) {
      console.log(`cleanup: ignored unsuccessful delete device connection: ${err}`)
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

    console.log()
  }

}

new HubDeviceIntegration().start().then(() => console.log('done'), (e) => console.log(`failed: ${e}`))
