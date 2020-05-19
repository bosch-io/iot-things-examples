/*
 *                          Bosch.IO Example Code License
 *                            Version 1.1, May 2020
 *
 * Copyright 2020 Bosch.IO GmbH (“Bosch.IO”). All rights reserved.
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
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH.IO AND THE PERSONAL LIABILITY OF BOSCH.IO’S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 *
 */

const axios = require('axios').default;

function createProxyOptions () {
  if (process.env.https_proxy) {
    const HttpsProxyAgent = require('https-proxy-agent');
    const agent = new HttpsProxyAgent(process.env.https_proxy);
    return {
      httpsAgent: agent,
      proxy: false // need to disable axios' default detection of the proxy, since it will mess with the ports
    };
  }
}

class BoschIotHub {
  constructor (config) {
    this.connected = false;
    this.subscriptionDuration = 60;
    this.onDittoProtocolMessage = (msg, command) => {
      console.log(`[Bosch IoT Hub] Ignoring command '${command}' from Ditto as long as no handler is ` +
                        'registered via #registerOnDittoProtocolMessage(callback): ', msg.data);
    };
    const proxyOptions = createProxyOptions();
    this.axiosInstance = axios.create({
      baseURL: config.HUB_HTTP_ADAPTER,
      auth: {
        username: `${config.HUB_DEVICE_AUTH_ID}@${config.HUB_TENANT}`,
        password: config.HUB_DEVICE_PASSWORD
      },
      ...proxyOptions
    });
  }

  connect () {
    console.log('[Bosch IoT Hub] Broker login');
    return true;
  }

  isDeviceConnected () {
    return this.connected;
  }

  publishAll (messages) {
    messages.map(message => this.publish('telemetry', message));
  }

  publish (topic, message) {
    const stringified = JSON.stringify(message);
    console.log(`[Bosch IoT Hub] Publishing on topic '${topic}': ${stringified}`);
    return this.axiosInstance({
      url: `/${topic}`,
      method: 'post',
      data: stringified
    })
      .catch(error => console.log('[Bosch IoT Hub] Publish failed.', error));
  }

  onHubMessage (msg) {
    if (msg.status === 202 && msg.data === '') {
      // ignoring this default timeout message
      console.log(`[Bosch IoT Hub] Subscription for ${this.subscriptionDuration} seconds expired.`);
    } else if (msg.data.topic && msg.data.path) {
      const payload = msg.data;
      const command = payload.topic.substring(payload.topic.lastIndexOf('/') + 1);
      this.onDittoProtocolMessage(payload, command);
    } else {
      console.log('[Bosch IoT Hub] Invalid JSON format in message: ', msg);
    }
  }

  subscribe () {
    try {
      console.log(`[Bosch IoT Hub] Subscribing for messages for ${this.subscriptionDuration} seconds.`);
      this.axiosInstance({
        url: '/event',
        method: 'post',
        headers: {
          'Content-Type': 'application/vnd.eclipse-hono-empty-notification',
          'hono-ttd': this.subscriptionDuration
        }
      })
        .then(msg => this.onHubMessage(msg))
        .catch(function (error) {
          if (error.response) {
            console.log(
                            `[Bosch IoT Hub] Unexpected non-success status ${error.response.status} with data: ${error.response.data}`);
          } else if (error.request) {
            // ignoring this at it is an expected error that happens after this.subscriptionDuration ends
          } else {
            console.log(`[Bosch IoT Hub] Error while preparing request: ${error.message}`);
          }
        })
        .finally(() => this.subscribe()); // automatically resubscribe after a request finished
      this.connected = true;
    } catch (e) {
      console.log('[Bosch IoT Hub] Error while subscribing for messages', e);
      this.connected = false;
    }
  }

  registerOnDittoProtocolMessage (callback) {
    this.onDittoProtocolMessage = callback;
  }
}

module.exports = BoschIotHub;
