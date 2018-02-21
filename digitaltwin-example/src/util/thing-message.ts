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

export class ThingMessage implements ThingMessageInfo {
  readonly topic: string
  readonly path: string
  readonly value: any
  readonly headers: any
  readonly fields?: string
  readonly status?: number

  private parsed: boolean = false
  private topicElements?: string[]
  private _thingId?: string

  constructor(obj: ThingMessageInfo) {
    this.topic = obj.topic
    this.headers = obj.headers
    this.path = obj.path
    this.value = obj.value
    this.fields = obj.fields
    this.status = obj.status
  }

  private doParse(): any {
    this.topicElements = this.topic.split('/')
    this._thingId = this.topicElements[0] + ':' + this.topicElements[1]

    const group = this.topicElements[2]
    if (['things'].indexOf(group) < 0) {
      throw new Error(`Topic group "${group}" invalid in topic "${this.topic}"`)
    }
    this.parsed = true
  }

  get thingId(): string {
    if (!this.parsed) { this.doParse() }
    return this._thingId!
  }

  get localThingId(): string {
    if (!this.parsed) { this.doParse() }
    return this.topicElements![1]
  }

  get channel(): channel {
    if (!this.parsed) { this.doParse() }
    const channel = this.topicElements![3]
    if (['twin', 'live'].indexOf(channel) < 0) {
      throw new Error(`Topic channel "${channel}" invalid in topic "${this.topic}"`)
    }
    return channel as channel
  }

  get criterion(): criterion {
    if (!this.parsed) { this.doParse() }
    const criterion = this.topicElements![4]
    if (['commands', 'events', 'search', 'messages', 'errors'].indexOf(criterion) < 0) {
      throw new Error(`Topic criterion "${criterion}" invalid in topic "${this.topic}"`)
    }
    return criterion as criterion
  }

  get action(): action {
    if (!this.parsed) { this.doParse() }
    const action = this.topicElements![5]
    // if (['create', 'retrieve', 'modify', 'delete', 'created', 'modified', 'deleted'].indexOf(action) < 0) {
    //   throw new Error(`Topic criterion "${action}" invalid in topic "${this.topic}"`)
    // }
    return action
  }

}
