import * as fs from 'fs'
import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
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

export class Accessories {

  private ws?: NodeWebSocket

  async start(): Promise<void> {
    console.log('[Accessories] start')

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
            console.log('[Accessories] unprocessed non-json data: ' + data)
          }
        })

        this.ws.send('START-SEND-MESSAGES', (err) => { if (err) console.log(`[Accessories] websocket send error ${err}`) })
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

  private async retrieveSupportedAccessories(p: { thingId, localThingId }): Promise<string> {
    return 'HERE ARE THE ACCESSORIES'
  }

}
