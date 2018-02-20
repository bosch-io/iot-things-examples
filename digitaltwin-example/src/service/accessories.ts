import * as fs from 'fs'
import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
import * as requestPromise from 'request-promise-native'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'
import { util } from '../util/util'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.websocketHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.accessories.username + ':' + CONFIG.accessories.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const REQUEST_OPTIONS: requestPromise.RequestPromiseOptions = {
  json: true,
  auth: { user: CONFIG.accessories.username, pass: CONFIG.accessories.password },
  headers: { 'x-cr-api-token': CONFIG.frontend.apitoken }
}

export class Accessories {

  private ws?: NodeWebSocket

  start(): Promise<void> {
    return new Promise((resolve, reject): void => {
      console.log('[Accessories] start')

      let pendingAcks: Array<string> = []

      // timeout if we cannot start within 10 secs
      setTimeout(() => reject(`Accessories start timeout; pending acks: ${pendingAcks}`), 10000)

      util.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
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
                  console.log('[Accessories] started')
                  resolve()
                }
              } else {
                console.log('[Accessories] excessive ACK ignored: ' + data)
              }
            } else {
              console.log('[Accessories] unprocessed non-json data: ' + data)
            }
          })

          this.ws.send('START-SEND-MESSAGES', (err) => { pendingAcks.push('START-SEND-MESSAGES:ACK'); if (err) console.log(`[Accessories] websocket send error ${err}`) })
        })
    })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'live' && m.criterion === 'messages'
      && m.path.startsWith('/features/Accessories/inbox/messages/')) {

      const subject = m.path.substr('/features/Accessories/inbox/messages/'.length)

      const requestValue = m.value
      const input = { ...requestValue, thingId: m.thingId, localThingId: m.localThingId }
      console.log(`[Accessories] received request ${subject}`)

      let processor = (p: any): Promise<any> => { throw new Error(`Unsupport message subject ${subject}`) }
      switch (subject) {
        case 'retrieveSupportedAccessories': processor = this.retrieveSupportedAccessories
      }

      util.processWithResponse(m, processor, input).then(r => {
        this.ws!.send(JSON.stringify(r), (err) => console.log('[Accessories] ' + (err ? 'websocket send error ' + err : 'websocket send response ok')))
      })
      return
    }

    console.log('[Accessories] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private async retrieveSupportedAccessories(p: { thingId, localThingId })
    : Promise<Array<{ name: string, manufacturer: string, gtin: string }>> {

    const productinfo = await requestPromise({
      ...REQUEST_OPTIONS,
      url: CONFIG.frontend.baseUrl + '/api/2/things/' + p.thingId + '/features/Productinfo/properties/config',
      method: 'GET'
    })
    console.log(`[Accessories] lookup product info: ${JSON.stringify(productinfo)}`)

    if (productinfo.model === 'D100A' && productinfo.manufacturer === 'ACME') {
      return [
        { name: 'Recharger', manufacturer: 'ACME', gtin: '12345678' },
        { name: 'Bag', manufacturer: 'Binford', gtin: '12345678901234' }
      ]
    } else {
      return []
    }
  }

}
