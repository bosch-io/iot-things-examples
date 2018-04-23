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
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <Arduino.h>
#include "octopus.h"
#include "printer.h"

Octopus::Octopus() {
  Serial.println("--- Initializing Octopus --- ");  

  this->initLights();
  
  delay(1000); // give sensors some time to start up
  this->initBme680();
  this->initBno055();
  delay(500);
  
  this->showColor(0, 0, 0x80, 0, 0); // green
}

void Octopus::connectToWifi(char* ssid, const char* password) {

  this->showColor(0, 0, 0, 0, 0x80); // white
  Printer::printMsg("Octopus::WiFi", String("Connecting to WiFi with SSID: '") + String(ssid) + String("' and password '") + String(password) + String("'"));
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  this->showColor(0, 0x80, 0x80, 0, 0); // yellow
  randomSeed(micros());
  Printer::printMsg("WiFi", "Connected. IP address: ");
  Serial.println(WiFi.localIP());
  this->showColor(0, 0, 0, 0x80, 0); // blue
}

void Octopus::showColor(char led, char red, char green, char blue, char white) {
  this->strip.setPixelColor(led, red, green, blue, white);
  this->strip.show();
}

float Octopus::getVcc () {
  return ESP.getVcc() / 1000.0;
}

Bno055Values Octopus::readBno055() {
  Bno055Values values;
  
  this->bno055.getCalibration(&values.calibrationSys, &values.calibrationGyro, &values.calibrationAccel, &values.calibrationMag);
  values.temperature = this->bno055.getTemp();
  
  imu::Vector<3> bnoAccel = this->bno055.getVector(Adafruit_BNO055::VECTOR_ACCELEROMETER);
  values.accelerationX = bnoAccel.x();
  values.accelerationY = bnoAccel.y();
  values.accelerationZ = bnoAccel.z();

  imu::Vector<3> bnoEuler = this->bno055.getVector(Adafruit_BNO055::VECTOR_EULER);
  values.orientationX = bnoEuler.x();
  values.orientationY = bnoEuler.y();
  values.orientationZ = bnoEuler.z();

  imu::Vector<3> bnoGravity = this->bno055.getVector(Adafruit_BNO055::VECTOR_GRAVITY);
  values.gravityX = bnoGravity.x();
  values.gravityY = bnoGravity.y();
  values.gravityZ = bnoGravity.z();
  
  imu::Vector<3> bnoGyro = this->bno055.getVector(Adafruit_BNO055::VECTOR_GYROSCOPE);
  values.angularVelocityX = bnoGyro.x();
  values.angularVelocityY = bnoGyro.y();
  values.angularVelocityZ = bnoGyro.z();

  imu::Vector<3> bnoLinearAccel = this->bno055.getVector(Adafruit_BNO055::VECTOR_LINEARACCEL);
  values.LinearAccelerationX = bnoLinearAccel.x();
  values.LinearAccelerationY = bnoLinearAccel.y();
  values.LinearAccelerationZ = bnoLinearAccel.z();

  imu::Vector<3> bnoMagnet = this->bno055.getVector(Adafruit_BNO055::VECTOR_MAGNETOMETER);
  values.magneticFieldStrengthX = bnoMagnet.x();
  values.magneticFieldStrengthY = bnoMagnet.y();
  values.magneticFieldStrengthZ = bnoMagnet.z();

  return values;
}

Bme680Values Octopus::readBme680() {
  Bme680Values values;
  if (!this->bme680.performReading()) { 
    Serial.println("Sensor reading failure");
    return values;
  } else {
    values.temperature = bme680.temperature;
    values.pressure = bme680.pressure;
    values.humidity = bme680.humidity;
    values.gas_resistance = bme680.gas_resistance;
    values.altitude = bme680.readAltitude(SEALEVELPRESSURE_HPA);
    return values;
  }
}

void Octopus::initBme680() {
  Printer::printlnMsg("Octopus", "Initializing BME680: ");
  if (this->bme680.begin(118)) {
    this->bme680.setTemperatureOversampling(BME680_OS_8X);
    this->bme680.setHumidityOversampling(BME680_OS_2X);
    this->bme680.setPressureOversampling(BME680_OS_4X);
    this->bme680.setIIRFilterSize(BME680_FILTER_SIZE_3);
    this->bme680.setGasHeater(320, 150); // 320*C for 150 ms
    Serial.println("OK");
  } else {
    Serial.println("Not found");
  }
}

void Octopus::initBno055() {
  Printer::printlnMsg("Octopus", "Initializing BNO055: ");
  if (this->bno055.begin()) {
    this->bno055.setExtCrystalUse(true);
    Serial.println("OK");
  } else {
    Serial.println("Not found");
  }
}

void Octopus::initLights() {
  Printer::printlnMsg("Octopus", "Initializing Neopixels");
  this->strip.begin();
  this->strip.show(); 
  // Initialize all pixels to 'off'
  this->strip.setPixelColor(0,0,0,0);
  this->strip.setPixelColor(1,0,0,0);
  this->strip.show(); 
}
