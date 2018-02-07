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
