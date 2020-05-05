/*
 *                                            Bosch.IO Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2020 Bosch.IO GmbH. All rights reserved.
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
 * BOSCH.IO PROVIDES THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH.IO HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH.IO SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH.IO SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH.IO IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH.IO AND THE PERSONAL LIABILITY OF BOSCH.IO'S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 */

import { AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as HttpsProxyAgent from 'https-proxy-agent'
import * as NodeWebSocket from 'ws'
import { Helpers } from './helpers'
import { OAuthConfig } from './config'

const axios = require('axios').default
const axiosHttp = require('axios/lib/adapters/http')
const WEBSOCKET_RECONNECT_TIMEOUT = 5000
const httpsProxyAgent = process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy) : null

function createDefaultAxiosRequestConfig(): AxiosRequestConfig {
  const options: AxiosRequestConfig = {}
  if (httpsProxyAgent) {
    // axios has a bug which does not allow sending https requests over a http proxy. using https agent instead.
    options['proxy'] = false
    options['httpsAgent'] = httpsProxyAgent
  }
  return options
}

function createDefaultWebsocketOptions(): NodeWebSocket.ClientOptions {
  return {
    agent: httpsProxyAgent || undefined
  }
}

export class SuiteAuthService {
  private readonly axiosInstance: AxiosInstance
  private readonly clientCredentialsBody: any

  constructor(oauthConfig: OAuthConfig) {
    this.axiosInstance = createAxiosInstance({
      baseURL: oauthConfig.host,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    })
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', oauthConfig.clientId)
    params.append('client_secret', oauthConfig.clientSecret)
    params.append('scope', oauthConfig.scope)
    this.clientCredentialsBody = params
  }

  createAxiosAdapter(): AxiosAdapter {
    return (config: AxiosRequestConfig) => this.requestAuthorized(config)
  }

  createWebSocket(websocketUrl: string, onOpenCallback: (ws: NodeWebSocket) => void, additionalOptions?: NodeWebSocket.ClientOptions) {
    const options = { ...createDefaultWebsocketOptions(), ...additionalOptions }
    this.getToken()
      .then(token => {
        options.headers = { ...options.headers, Authorization: `Bearer ${token}` }
        Helpers.openWebSocket(websocketUrl, options, WEBSOCKET_RECONNECT_TIMEOUT, onOpenCallback)
      })
  }

  getToken(): Promise<string> {
    return this.axiosInstance.post('token', this.clientCredentialsBody)
      .then(response => {
        if (response.status === 200) {
          return response.data.access_token
        }
        throw new Error(`Failed to retrieve client credentials token with status ${response.status}: ${response.data}`)
      })
  }

  private requestAuthorized(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.getToken()
      .then(token => {
        config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` }
        return axiosHttp(config)
      })
  }

}

export function createAxiosInstance(additionalRequestConfig?: AxiosRequestConfig, adapter?: AxiosAdapter): AxiosInstance {
  const requestConfig = createDefaultAxiosRequestConfig()
  requestConfig.adapter = adapter
  return axios.create({ ...requestConfig, ...additionalRequestConfig })
}
