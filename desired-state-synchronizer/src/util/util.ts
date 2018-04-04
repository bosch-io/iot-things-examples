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

import * as NodeWebSocket from 'ws'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'

export namespace util {

  /** Create partial object starting at nested path element. */
  export function partial(path: string, subobject: any): any {
    if (!path.startsWith('/')) throw new Error('Path "' + path + '" expected to start with "/"')
    const pathelements = path.substr(1).split('/')
    const last = pathelements.pop() as string
    let result = {}
    let current: any = result
    pathelements.forEach(pathelement => {
      current[pathelement] = {}
      current = current[pathelement]
    })
    current[last] = subobject
    if (!last) { result = subobject }
    return result
  }

  /** Opens WebSocket and prepares automatic re-open and keep-alive (heartbeat) mechanism. */
  export function openWebSocket(url: string, options: any, timeout: number, onOpenCallback: (ws: NodeWebSocket) => void) {

    let ws = new NodeWebSocket(url, options)

    ws.on('open', () => {
      onOpenCallback(ws)

      // Heartbeat messages
      setInterval(() => { if (ws.readyState === NodeWebSocket.OPEN) ws.ping() }, 60000)
    })

    ws.on('close', () => {
      console.log('websocket closed; trying to re-open')
      setTimeout(() => openWebSocket(url, options, timeout, onOpenCallback), timeout)
    })

    ws.on('error', (err) => {
      console.log(`websocket error ${err}`)
    })
  }

  /** Create response message after processing. */
  export async function processWithResponse<I, O>(request: ThingMessage, processor: (I: any) => O, input: I): Promise<ThingMessage> {
    let status = 200
    let response: O | { error: string }
    try {
      response = await processor(input)
    } catch (e) {
      response = { error: e.toString() }
      status = 400
      // console.log(`processWithResponse error ${e}`)
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

  export async function processAll(a: Array<() => void>, logprefix: string) {
    a.forEach(async (f, i, a) => {
      try {
        await f()
      } catch (e) {
        console.log(`${logprefix}: ${JSON.stringify(e.error || e)}`)
      }
      a.splice(i, 1)
    })
  }

  export async function sleep(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
  }

}
