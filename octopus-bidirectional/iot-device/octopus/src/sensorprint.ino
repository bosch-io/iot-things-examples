/*
 * Bosch SI Example Code License Version 1.0, January 2016
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
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE
 * QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL
 * NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH BOSCH
 * SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT LIMITATION FOR
 * INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF THE GERMAN
 * PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN UNAFFECTED
 * BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF LIABILITY
 * ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S EMPLOYEES,
 * REPRESENTATIVES AND ORGANS.
 */

void printSensorData(float vcc, const Bme680Values &bme680Values, const Bno055Values &bno055Values)
{
  printVcc(vcc);
  printBme680(bme680Values);
  printBno055(bno055Values);
}

void printBme680(const Bme680Values &bme680Values)
{
  Printer::printMsg("BME680", "temp: ");
  Serial.print(bme680Values.temperature);
  Serial.print(" °C, pressure: ");
  Serial.print(bme680Values.pressure / 100.0);
  Serial.print(" hPa, humidity: ");
  Serial.print(bme680Values.humidity);
  Serial.print(" %, Gas: ");
  Serial.print(bme680Values.gas_resistance / 1000.0);
  Serial.print(" KOhms, altitude = ");
  Serial.print(bme680Values.altitude);
  Serial.println(" m");
}

void printBno055(const Bno055Values &bno055Values)
{
  // Only use values if calibration status > 0
  Printer::printMsg("BNO055", "Calibration status: Sys=");
  Serial.print(bno055Values.calibrationSys, DEC);
  Serial.print(", Gyro=");
  Serial.print(bno055Values.calibrationGyro, DEC);
  Serial.print(", Accel=");
  Serial.print(bno055Values.calibrationAccel, DEC);
  Serial.print(", Mag=");
  Serial.println(bno055Values.calibrationMag, DEC);

  Printer::printMsg("BNO055", "Ambient Temperature: ");
  Serial.print(bno055Values.temperature);
  Serial.println("°C");

  Printer::printMsg("BNO055", "Acceleration (m/s^2) x=");
  Serial.print(bno055Values.accelerationX);
  Serial.print(", y=");
  Serial.print(bno055Values.accelerationY);
  Serial.print(", z=");
  Serial.println(bno055Values.accelerationZ);

  Printer::printMsg("BNO055", "Abs Orientation (°, Euler) x=");
  Serial.print(bno055Values.orientationX);
  Serial.print(", y=");
  Serial.print(bno055Values.orientationY);
  Serial.print(", z=");
  Serial.println(bno055Values.orientationZ);

  Printer::printMsg("BNO055", "Gravity (m/s^2) x=");
  Serial.print(bno055Values.gravityX);
  Serial.print(", y=");
  Serial.print(bno055Values.gravityY);
  Serial.print(", z=");
  Serial.println(bno055Values.gravityZ);

  Printer::printMsg("BNO055", "Angular velocity (rad/s) x=");
  Serial.print(bno055Values.angularVelocityX);
  Serial.print(", y=");
  Serial.print(bno055Values.angularVelocityY);
  Serial.print(", z=");
  Serial.println(bno055Values.angularVelocityZ);

  Printer::printMsg("BNO055", "Linear Acceleration (m/s^2) x=");
  Serial.print(bno055Values.LinearAccelerationX);
  Serial.print(", y=");
  Serial.print(bno055Values.LinearAccelerationY);
  Serial.print(", z=");
  Serial.println(bno055Values.LinearAccelerationZ);

  Printer::printMsg("BNO055", "Magnetic Field Strength (uT) x=");
  Serial.print(bno055Values.magneticFieldStrengthX);
  Serial.print(", y=");
  Serial.print(bno055Values.magneticFieldStrengthY);
  Serial.print(", z=");
  Serial.println(bno055Values.magneticFieldStrengthZ);
}

void printVcc(float power)
{
  Printer::printMsg("VCC", "ESP8266 supply voltage: ");
  Serial.println(power);
}