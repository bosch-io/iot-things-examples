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

const { GenericSensor, sensorsToJson } = require('./generic-sensor');

class Bno55 {
  constructor () {
    this.sensors = [
      new GenericSensor('calibrationSys', [1]),
      new GenericSensor('calibrationGyro', [1]),
      new GenericSensor('calibrationAccel', [1]),
      new GenericSensor('calibrationMag', [1]),
      new GenericSensor('temperature', [24, 25, 24, 26, 27, 24, 23]),
      new GenericSensor('acceleration', [
        { x: 0, y: 0, z: 0 },
        { x: 0.7, y: -0.3, z: 4.5 },
        { x: -1.04, y: 0.13, z: -9.75 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ]),
      new GenericSensor('orientation', [
        { x: 236.5, y: -6.0625, z: -179.1875 },
        { x: 233.4, y: -5.1321, z: -13.15 },
        { x: 0.7, y: -0.3, z: 4.5 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: -1.04, y: 0.13, z: -9.75 }
      ]),
      new GenericSensor('gravity', [
        { x: -1.04, y: 0.13, z: -9.75 },
        { x: 1.04, y: 1.3, z: -3.66 },
        { x: 3.44, y: 2.5, z: 2.11 },
        { x: 7.74, y: -3.13, z: 4.35 },
        { x: 8.04, y: -1.78, z: 4.22 },
        { x: -2.24, y: 0.5, z: 2.75 }
      ]),
      new GenericSensor('angular_velocity', [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0.7, y: -0.3, z: 4.5 },
        { x: 0, y: 0, z: 0 },
        { x: -1.04, y: 0.13, z: -9.75 },
        { x: 0, y: 0, z: 0 }
      ]),
      new GenericSensor('LinearAcceleration', [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0.12, y: 0.04, z: 0.06 },
        { x: 0.31, y: 0.14, z: 0.63 },
        { x: 0.33, y: 0.01, z: 0.44 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ]),
      new GenericSensor('magneticFieldStrength', [
        { x: -14.875, y: -15.5625, z: 54.75 },
        { x: -11.446, y: -1.5, z: 33.333 },
        { x: 3.33, y: -4.129, z: 14.77 },
        { x: 15.1, y: 3.5, z: 5.15 }
      ])
    ];
    console.log('Initializing BNO055: OK');
  }

  read () {
    return this.toJSON();
  }

  toJSON () {
    return sensorsToJson(this.sensors);
  }
}

module.exports = Bno55;
