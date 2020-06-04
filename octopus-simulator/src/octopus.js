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

const Bme280 = require('./bme280');
const Bme680 = require('./bme680');
const Bno55 = require('./bno55');
const NeoPixel = require('./neo-pixel');
const { GenericSensor } = require('./generic-sensor');

class Octopus {
  constructor (hasBme280) {
    console.log('--- Initializing Octopus ---');
    this.voltageSensor = new GenericSensor('voltage', [3.044, 3.032, 3.032, 3.02, 3.004]);

    console.log('Initializing Neopixels');
    this.neoPixel = new NeoPixel();
    this.neoPixel.showColor(0, 0, 0, 0);

    this.bme = hasBme280 ? new Bme280() : new Bme680();
    this.bno = new Bno55();

    this.neoPixel.showColor(0, 128, 0, 0); // green
  }

  readLed () {
    return this.neoPixel.readLed();
  }

  readBme () {
    return this.bme.read();
  }

  readBno () {
    return this.bno.read();
  }

  getVcc () {
    return this.voltageSensor.getNextValue();
  }

  showColor (r, g, b, w) {
    this.neoPixel.showColor(r, g, b, w);
  }
}

module.exports = Octopus;
