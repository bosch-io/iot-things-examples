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

String sensorUpdateString(String featureName, float sensorValue, float minValue, float maxValue, String units) {
    String output = "{\"topic\": \"";
    output += THINGS_NAMESPACE;
    output += "/";
    output += THING_ID;
    output += "/things/twin/commands/modify\",\"headers\": {\"response-required\": false},";
    output += "\"path\": \"/features/" + featureName + "/properties/status\", \"value\": {\"sensorValue\": " + sensorValue;
    output += ", \"minMeasuredValue\": ";
    output += minValue;
    output += ", \"maxMeasuredValue\": ";
    output += maxValue;
    output += ", \"sensorUnits\": \"";
    output += units;
    output += "\"}}";    
    return output;
}

String sensor3dUpdateString(String featureName, float xValue, float yValue, float zValue, String units) {
    String output = "{\"topic\": \"";
    output += THINGS_NAMESPACE;
    output += "/";
    output += THING_ID;
    output += "/things/twin/commands/modify\",\"headers\": {\"response-required\": true},";
    output += "\"path\": \"/features/" + featureName + "/properties/status\", \"value\": {\"xValue\": " + xValue;
    output += ", \"yValue\": ";
    output += yValue;
    output += ", \"zValue\": ";
    output += zValue;
    output += ", \"sensorUnits\": \"";
    output += units;
    output += "\"}}";    
    return output;
}

unsigned long lastSensorUpdateMillis = 0;
// ---- Pretty-printing Functions ----

float humidityMin = 1E+20;
float humidityMax = 1E-20;
float humidity;
float tempMin = 1E+20;
float tempMax = 1E-20;
float temp;
float barometerMin = 1E+20;
float barometerMax = 1E-20;
float barometer;
float powerMin = 1E+20;
float powerMax = 1E-20;
float power;
float analogInMin = 1E+20;
float analogInMax = 1E-20;
float analogIn;
float tempBnoMin = 1E+20;
float tempBnoMax = 1E-20;
float tempBno;

void loopSensors(Octopus* octopus, BoschIotHub* hub) {
  if (millis() - lastSensorUpdateMillis > SENSOR_UPDATE_RATE_MS) {
    lastSensorUpdateMillis = millis();
    printSensors(octopus, hub);
  }
  delay(LOOP_DELAY);
}

void printSensors (Octopus* octopus, BoschIotHub* hub) {
  Serial.println("--- Sensor Loop --- ");
  
  Printer::printMsg("VCC", "ESP8266 supply voltage: ");
  power = octopus->getVcc();
  Serial.println(power);
  if (powerMin > power) {
    powerMin = power;
  }
  if (powerMax < power) {
    powerMax = power;
  }
  hub->publish(sensorUpdateString("Power_0", power, powerMin, powerMax, "V"));
 
  Printer::printMsg("BME680", "temp: ");
  
  Bme680Values bme680Values = octopus->readBme680();
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
    
  humidity = bme680Values.humidity;
  if (humidityMin > humidity) {
    humidityMin = humidity;
  }
  if (humidityMax < humidity) {
    humidityMax = humidity;
  }
  hub->publish(sensorUpdateString("HumiditySensor_BME680", humidity, humidityMin, humidityMax, "%"));
  temp = bme680Values.temperature;
  if (tempMin > temp) {
    tempMin = temp;
  }
  if (tempMax < temp) {
    tempMax = temp;
  }
  hub->publish(sensorUpdateString("TemperatureSensor_BME680", temp, tempMin, tempMax, "°C"));
  barometer = bme680Values.pressure / 100.0;
  if (barometerMin > barometer) {
    barometerMin = barometer;
  }
  if (barometerMax < barometer) {
    barometerMax = barometer;
  }
  hub->publish(sensorUpdateString("Barometer_BME680", barometer, barometerMin, barometerMax, "hPa"));        

  Bno055Values bno055Values = octopus->readBno055();
  
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
  float tempBno = bno055Values.temperature;
  Serial.print(tempBno);
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

  if (tempBnoMin > tempBno) {
    tempBnoMin = tempBno;
  }
  if (tempBnoMax < tempBno) {
    tempBnoMax = tempBno;
  }
  hub->publish(sensorUpdateString("TemperatureSensor_BNO055", tempBno, tempBnoMin, tempBnoMax, "°C"));
  // if (bno055Values.calibrationSys > 0) {
      hub->publish(sensor3dUpdateString("Accelerometer_BNO055", bno055Values.accelerationX, bno055Values.accelerationY, bno055Values.accelerationZ, "m/s^2"));
      hub->publish(sensor3dUpdateString("AbsoluteOrientation_BNO055", bno055Values.orientationX, bno055Values.orientationY, bno055Values.orientationZ, "°"));
      hub->publish(sensor3dUpdateString("Gravity_BNO055", bno055Values.gravityX, bno055Values.gravityY, bno055Values.gravityZ, "m/s^2"));
      hub->publish(sensor3dUpdateString("AngularVelocity_BNO055", bno055Values.angularVelocityX, bno055Values.angularVelocityY, bno055Values.angularVelocityZ, "rad/s"));
      hub->publish(sensor3dUpdateString("LinearAcceleration_BNO055", bno055Values.LinearAccelerationX, bno055Values.LinearAccelerationY, bno055Values.LinearAccelerationZ, "m/s^2"));
      hub->publish(sensor3dUpdateString("Magnetometer_BNO055", bno055Values.magneticFieldStrengthX, bno055Values.magneticFieldStrengthY, bno055Values.magneticFieldStrengthZ, "uT"));
  /* } else {
      Printer::printMsg("BNO055", "Skipping update to hub, system calibration < 1");
  }*/

    Serial.println();
}
