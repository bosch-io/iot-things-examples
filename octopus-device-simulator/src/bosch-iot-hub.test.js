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
const BoschIotHub = require('./bosch-iot-hub');

jest.mock('axios');

const testConfig = {
  HUB_HTTP_ADAPTER: 'http://localhost:123',
  HUB_DEVICE_AUTH_ID: 'myAuth',
  HUB_TENANT: 'myTenant',
  HUB_DEVICE_PASSWORD: 'mySecret'
};

describe('Bosch IoT Hub', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    axios.create.mockReturnValue(axios);
  });

  test('should publish to given topic', () => {
    const hub = new BoschIotHub(testConfig);

    const topic = 'myTopic';
    const message = {
      any: 'foo',
      bar: 'stuff'
    };
    const response = {
      status: 202
    };
    axios.mockResolvedValue(response);

    const result = hub.publish(topic, message);

    expect(axios.mock.calls.length).toBe(1);
    const req = axios.mock.calls[0][0];
    expect(req.url).toEqual(`/${topic}`);
    expect(req.data).toEqual(JSON.stringify(message));
    expect(req.method).toEqual('post');

    return expect(result).resolves.toEqual(response);
  });

  test('should publish all on default telemetry topic', () => {
    const hub = new BoschIotHub(testConfig);

    const messages = [{
      any: 'foo'
    }, {
      bar: 'stuff'
    }];
    const response = {
      status: 202
    };
    axios.mockResolvedValue(response);

    hub.publishAll(messages);

    expect(axios.mock.calls.length).toBe(messages.length);
    messages.forEach((message, index) => {
      const req = axios.mock.calls[index][0];
      expect(req.url).toEqual('/telemetry');
      expect(req.data).toEqual(JSON.stringify(message));
      expect(req.method).toEqual('post');
    });
  });

  test('should subscribe to Bosch IoT Hub with a ttd', () => {
    const hub = new BoschIotHub(testConfig);

    expect(hub.isDeviceConnected()).toBe(false);

    const command = 'doSomething';
    const commandPayload = {
      doIt: 'now'
    };
    const dittoProtocolMessage = {
      data: {
        topic: `iot.things.examples/octopus-device-simulator/things/live/messages/${command}`,
        path: `/inbox/messages/${command}`,
        value: commandPayload
      }
    };
    axios.mockResolvedValue(dittoProtocolMessage);

    hub.subscribe();

    expect(hub.isDeviceConnected()).toBe(true);

    expect(axios.mock.calls.length).toBe(1);
    const req = axios.mock.calls[0][0];
    expect(req.url).toEqual('/event');
    expect(req.data).toBeUndefined();
    expect(req.method).toEqual('post');
    expect(req.headers['hono-ttd']).toEqual(60);
  });

  test('creates preconfigured axios instance on startup', () => {
    new BoschIotHub(testConfig); // eslint-disable-line

    expect(axios.create.mock.calls.length).toBe(1);
    const createConfig = axios.create.mock.calls[0][0];
    expect(createConfig.baseURL).toEqual(testConfig.HUB_HTTP_ADAPTER);
    expect(createConfig.auth).toEqual({
      username: `${testConfig.HUB_DEVICE_AUTH_ID}@${testConfig.HUB_TENANT}`,
      password: testConfig.HUB_DEVICE_PASSWORD
    });
  });
});
