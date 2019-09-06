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

/** Interface to describe Bosch IoT Things / Eclipse Ditto protocol message. */
export interface ThingMessageInfo {
  topic: string
  path: string
  value: any
  headers?: any
  fields?: string
  status?: number
}

type channel = 'twin' | 'live'
type criterion = 'commands' | 'events' | 'search' | 'messages' | 'errors'
type action = 'create' | 'retrieve' | 'modify' | 'delete' | 'created' | 'modified' | 'deleted' | string

/** Convenience class to work with Bosch IoT Things / Eclipse Ditto protocol message.
 *
 * Adds some parsing functionality on top of the ThingMessageInfo interface.
 */
export class ThingMessage implements ThingMessageInfo {
  readonly topic: string
  readonly path: string
  readonly value: any
  readonly headers: any
  readonly fields?: string
  readonly status?: number

  private _parsed: boolean = false
  private _topicElements?: string[]
  private _thingId?: string

  constructor(obj: ThingMessageInfo) {
    this.topic = obj.topic
    this.headers = obj.headers
    this.path = obj.path
    this.value = obj.value
    this.fields = obj.fields
    this.status = obj.status
  }

  toJSONString() {
    return JSON.stringify(this, (k, v) => k.startsWith('_') ? undefined : v)
  }

  private doParse(): any {
    this._topicElements = this.topic.split('/')
    this._thingId = this._topicElements[0] + ':' + this._topicElements[1]

    const group = this._topicElements[2]
    if (['things'].indexOf(group) < 0) {
      throw new Error(`Topic group "${group}" invalid in topic "${this.topic}"`)
    }
    this._parsed = true
  }

  get thingId(): string {
    if (!this._parsed) { this.doParse() }
    return this._thingId!
  }

  get namespace(): string {
    if (!this._parsed) { this.doParse() }
    return this._topicElements![0]
  }

  get localThingId(): string {
    if (!this._parsed) { this.doParse() }
    return this._topicElements![1]
  }

  get channel(): channel {
    if (!this._parsed) { this.doParse() }
    const channel = this._topicElements![3]
    if (['twin', 'live'].indexOf(channel) < 0) {
      throw new Error(`Topic channel "${channel}" invalid in topic "${this.topic}"`)
    }
    return channel as channel
  }

  get criterion(): criterion {
    if (!this._parsed) { this.doParse() }
    const criterion = this._topicElements![4]
    if (['commands', 'events', 'search', 'messages', 'errors'].indexOf(criterion) < 0) {
      throw new Error(`Topic criterion "${criterion}" invalid in topic "${this.topic}"`)
    }
    return criterion as criterion
  }

  get action(): action {
    if (!this._parsed) { this.doParse() }
    const action = this._topicElements![5]
    return action
  }

}

export namespace Helpers {

  /** Create partial object starting at nested path element.
   *
   * Example: partial('/a/b', { c: 1, d: { e: 2 } }) = { a: { b: { c: 1, d: { e: 2 } } } }
   */
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
  export async function processWithResponse<I, O>(request: ThingMessage, processor: (I) => O, input: I): Promise<ThingMessage> {
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
        // include also (redundant) thing-id and subject as specificed in Ditto protocol; may be obsolete after CR-5200
        'thing-id': request.thingId,
        subject: request.action
      },
      'path': request.path.replace('inbox', 'outbox'),
      'status': status,
      'value': response
    } as ThingMessageInfo)
  }

  /** Sequentielly invokes and array of functions, waiting for each execution. Errors are just logged, but execution continues. */
  export async function processAll(a: Array<() => void>, errorLogPrefix) {
    for await (const [i, f] of a.entries()) {
      try {
        await f()
      } catch (e) {
        console.log(`${errorLogPrefix}: ${JSON.stringify(e.error || e.message || e)}`)
      }
    }
    a.length = 0
  }

  export async function sleep(milliseconds): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
  }

}
