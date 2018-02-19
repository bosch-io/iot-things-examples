import * as fs from 'fs'
import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
import * as requestPromise from 'request-promise-native'
import * as Ajv from 'ajv'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'
import { util } from '../util/util'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.websocketHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.deviceCommissioning.username + ':' + CONFIG.deviceCommissioning.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const JSON_SCHEMA_VALIDATOR = new Ajv({ schemaId: 'auto', allErrors: true })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

const COMMISSION_VALIDATION = JSON_SCHEMA_VALIDATOR.compile(JSON.parse(fs.readFileSync('models/json-schema/org.eclipse.ditto_HonoCommissioning_1.0.0/operations/commission.schema.json', 'utf8')))

export class DeviceCommissioning {

  private ws?: NodeWebSocket

  async start(): Promise<void> {
    console.log('[Commissioning] start')

    // DEBUG
    // await this.commission({ thingId: 'abc:xxx', localThingId: 'xxx:', hubTenant: 'xxx', hubDevicePasswordHashed: 'xxx' })

    util.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
      (ws) => {
        this.ws = ws

        this.ws.on('message', (data) => {
          const dataString = data.toString()
          if (dataString.startsWith('{')) {
            this.process(new ThingMessage(JSON.parse(dataString) as ThingMessageInfo))
          } else if (dataString.startsWith('START-SEND-') && dataString.endsWith(':ACK')) {
            // ignore START-SEND-*:ACK
          } else {
            console.log('[Commissioning] unprocessed non-json data: ' + data)
          }
        })

        this.ws.send('START-SEND-MESSAGES', (err) => { if (err) console.log(`[Commissioning] websocket send error ${err}`) })
      })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'live' && m.criterion === 'messages' && m.action === 'commission'
      && m.path === '/features/Commissioning/inbox/messages/commission') {

      if (COMMISSION_VALIDATION(m.value)) {
        console.log(`[Commissioning] received valid request`)
      } else {
        console.log(`[Commissioning] request validation faild: ${JSON.stringify(COMMISSION_VALIDATION.errors)}`)
        return
      }

      const requestValue = m.value as {
        tenantId: string,
        devicePasswordHashed: string
      }
      const input = { ...requestValue, thingId: m.thingId, localThingId: m.localThingId }

      util.processWithResponse(m, this.commission, input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => console.log('[Commissioning] ' + (err ? 'websocket send error ' + err : 'websocket send response ok')))
      })
      return
    }

    console.log('[Commissioning] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private async commission(p: { thingId, localThingId, tenantId, devicePasswordHashed })
    : Promise<{ code: number, text?: string }> {

    // ##################################### CURRENTLY NO COMMISSIONING TO BOSCH IOT HUB
    // tslint:disable-next-line:no-constant-condition
    if (1 > 0) return { code: 200, text: 'Dummy Commissioning OK' }

    const hubTenant = p.tenantId
    const hubDeviceId = p.localThingId
    const hubDeviceAuthId = hubDeviceId

    let cleanup: Array<() => void> = []

    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/credentials/' + hubTenant
        + '?device-id=' + hubDeviceId + '&auth-id=' + hubDeviceAuthId + '&type=' + 'hashed-password',
      method: 'DELETE'
    }))
    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + hubTenant + '/' + hubDeviceId,
      method: 'DELETE'
    }))
    console.log('[Commissioning] cleanup')
    cleanup.forEach(async (f, i, a) => {
      try {
        await f()
      } catch (e) {
        console.log(`[Commissioning] ignore failed cleanup ${e}`)
      }
      a.splice(i)
    })

    console.log(`[Commissioning] register hub device ${JSON.stringify(p)} hubDeviceId: ${hubDeviceId}, hubDeviceAuthId: ${hubDeviceAuthId}`)
    const r = await requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + hubTenant,
      method: 'POST',
      json: true,
      body: {
        'device-id': hubDeviceId
      }
    })
    console.log(`[Commissioning]   result ${r}`)

    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/registration/' + hubTenant + '/' + hubDeviceId,
      method: 'DELETE'
    }))

    try {
      console.log(`[Commissioning] register hub device credential`)
      const r2 = await requestPromise({
        url: 'https://device-registry.bosch-iot-hub.com/credentials/' + hubTenant,
        method: 'POST',
        json: true,
        body: {
          'device-id': hubDeviceId,
          'auth-id': hubDeviceAuthId,
          'type': 'hashed-password',
          'secrets': [{
            'hash-function': 'sha-512',
            'pwd-hash': p.devicePasswordHashed
          }]
        }
      })
      console.log(`[Commissioning]   result ${r2}`)
    } catch (err) {
      cleanup.forEach((f, i, a) => { f(); a.splice(i) })
      throw err
    }

    cleanup.push(() => requestPromise({
      url: 'https://device-registry.bosch-iot-hub.com/credentials/' + hubTenant
        + '?device-id=' + hubDeviceId + '&auth-id=' + hubDeviceAuthId + '&type=' + 'hashed-password',
      method: 'DELETE'
    }))

    return { code: 200, text: 'Hub Commissioning OK' }
  }

}
