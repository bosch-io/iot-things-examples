import * as NodeWebSocket from 'ws'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'

export namespace util {

  /** Create partial object starting at nested path element. */
  export function partial(path: string, subobject: any): any {
    const pathelements = path.substr(1).split('/')
    const last = pathelements.pop() as string
    const result = {}
    let current: any = result
    pathelements.forEach(pathelement => {
      current[pathelement] = {}
      current = current[pathelement]
    })
    current[last] = subobject
    return result
  }

  /** Opens WebSocket and prepares automatic re-open and keep-alive (heartbeat) mechanism. */
  export function openWebSocket(url: string, options, timeout, onOpenCallback: (ws: NodeWebSocket) => void) {

    let ws = new NodeWebSocket(url, options)

    ws.on('open', () => {
      onOpenCallback(ws)

      // Heartbeat messages
      setInterval(() => ws.ping(), 60000)
    })

    ws.on('close', () => {
      console.log('websocket closed; trying to re-open')
      setTimeout(() => openWebSocket(url, options, onOpenCallback, timeout), timeout)
    })

    ws.on('error', (err) => {
      console.log(`websocket error ${err}`)
    })
  }

  /** Create response message after processing. */
  export async function processWithResponse<I, O>(request: ThingMessage, processor: (I) => O, input: I): Promise<ThingMessage> {
    let status = 200
    let response: O | { error: string }
    try {
      response = await processor(input)
    } catch (e) {
      response = { error: e.toString() }
      status = 400
    }

    return new ThingMessage({
      topic: request.topic,
      headers: {
        'correlation-id': request.headers['correlation-id'],
        'content-type': 'application/json',
        direction: 'FROM',
        // include also (redundant) thing-id and subject as specificed in Ditto protocol; may be obsolte after CR-5200
        'thing-id': request.thingId,
        subject: request.action
      },
      'path': request.path.replace('inbox', 'outbox'),
      'status': status,
      'value': response
    } as ThingMessageInfo)
  }

}
