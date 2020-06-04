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

const Bno55 = require('./bno55');

test('Bno55 provides all sensor values as JSON', () => {
  const bno55 = new Bno55();

  const sensorValues = bno55.read();

  expect(sensorValues.calibrationSys).toBeDefined();
  expect(sensorValues.calibrationGyro).toBeDefined();
  expect(sensorValues.calibrationAccel).toBeDefined();
  expect(sensorValues.calibrationMag).toBeDefined();
  expect(sensorValues.acceleration.x).toBeDefined();
  expect(sensorValues.acceleration.y).toBeDefined();
  expect(sensorValues.acceleration.z).toBeDefined();
  expect(sensorValues.orientation.x).toBeDefined();
  expect(sensorValues.orientation.y).toBeDefined();
  expect(sensorValues.orientation.z).toBeDefined();
  expect(sensorValues.gravity.x).toBeDefined();
  expect(sensorValues.gravity.y).toBeDefined();
  expect(sensorValues.gravity.z).toBeDefined();
  expect(sensorValues.angular_velocity.x).toBeDefined();
  expect(sensorValues.angular_velocity.y).toBeDefined();
  expect(sensorValues.angular_velocity.z).toBeDefined();
  expect(sensorValues.LinearAcceleration.x).toBeDefined();
  expect(sensorValues.LinearAcceleration.y).toBeDefined();
  expect(sensorValues.LinearAcceleration.z).toBeDefined();
  expect(sensorValues.magneticFieldStrength.x).toBeDefined();
  expect(sensorValues.magneticFieldStrength.y).toBeDefined();
  expect(sensorValues.magneticFieldStrength.z).toBeDefined();
});
