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

const config = require('../config');
const Octopus = require('./octopus');
const SensorStatistics = require('./sensor-statistics');
const BoschIotHub = require('./bosch-iot-hub');

class Arduino {
  constructor (config) {
    this.config = config;
    this.sensorUpdateRate = config.SENSOR_UPDATE_RATE_MS;
    this.sensorStatistics = new SensorStatistics(config);
    this.lastSensorUpdateMillis = Date.now() - this.sensorUpdateRate;
    this.hub = new BoschIotHub(this.config);
    this.octopus = new Octopus(this.config.BME_280);
  }

  customMessageHandler (payload, command) {
    const path = payload.path;
    const switchLedPath = '/features/led/inbox/messages/setColor';

    console.log(`Got command: ${command}`);

    const response = { ...payload };

    if (command === 'switch_led' || (command === 'setColor' && switchLedPath.equals(path))) {
      this.octopus.showColor(payload.value.r, payload.value.g, payload.value.b, payload.value.w);
      response.value = `Command '${command}' executed`;
      response.status = 200;
    } else if (command === 'change_update_rate') {
      this.sensorUpdateRate = payload.value;
      response.value = `Command '${command}' executed`;
      response.status = 200;
    } else {
      response.value = `Command unknown: '${command}'`;
      response.status = 404;
    }

    this.hub.publish('event', response);
  }

  loop () {
    if (!this.hub.isDeviceConnected()) {
      this.octopus.showColor(128, 0, 0, 0); // red
      this.hub.registerOnDittoProtocolMessage((msg, command) => this.customMessageHandler(msg, command));
      this.hub.subscribe();
      this.octopus.showColor(0, 128, 0, 0); // green
    }

    if (this.shouldUpdateSensorValues()) {
      this.lastSensorUpdateMillis = Date.now();

      const bmeValues = this.octopus.readBme();
      const bnoValues = this.octopus.readBno();
      const vcc = this.octopus.getVcc();
      const ledValues = this.octopus.readLed();

      const featurePropertyUpdateCommands =
                this.sensorStatistics.createFeaturePropertyUpdateCommands(vcc, bmeValues, bnoValues, ledValues);
      this.hub.publishAll(featurePropertyUpdateCommands);
    }
  }

  shouldUpdateSensorValues () {
    return Date.now() - this.lastSensorUpdateMillis > this.sensorUpdateRate;
  }
}

const arduino = new Arduino(config);
setInterval(() => {
  try {
    arduino.loop();
  } catch (e) {
    console.log('Restarting octopus', e);
  }
}, config.LOOP_DELAY);
