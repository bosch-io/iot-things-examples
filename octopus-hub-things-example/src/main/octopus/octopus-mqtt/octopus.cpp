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
#include "time.h"

void Octopus::begin() {
   Serial.println("--- Initializing Octopus --- ");  

  this->initLights();
  
  delay(1000); // give sensors some time to start up
  #ifdef BME280
  this->initBme280();
  #else
  this->initBme680();
  #endif
  this->initBno055();
  delay(500);
  
  this->showColor(0, 0, 0x80, 0, 0); // green
}

void Octopus::connectToWifi(char* ssid, const char* password) {

  WiFi.mode(WIFI_STA);
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
  Octopus::setupNTP();
}

void Octopus::setupNTP(){
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = 0;
  while(now < 100000){
    delay(500);
    time(&now);
  }
  Printer::printMsg("WiFi", "NTP. Time: ");
  Serial.println(ctime(&now));
}

void Octopus::showColor(char led, char red, char green, char blue, char white) {
  this->strip.setPixelColor(led, red, green, blue, white);
  this->strip.show();
}

float Octopus::getVcc () {
  return ESP.getVcc() / 1000.0;
}

bool Octopus::readBno055(Bno055Values &values) {
  if(!bno055Ready)
    return false;

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

  return true;
}

#ifdef BME280
void Octopus::initBme280() {
  Printer::printMsg("Octopus", "Initializing BME280: ");
  if (this->bme280.begin()) {
    bme280Ready = true;
    Serial.println("OK");
  } else {
    bme280Ready = false;
    Serial.println("Not found");
  }
}

bool Octopus::readBme280(Bme680Values &values) {
  if(!bme280Ready)
    return false;

  this->bme280.begin(0x77);
  values.temperature = this->bme280.readTemperature();
  values.pressure = this->bme280.readPressure();
  values.humidity = this->bme280.readHumidity();
  values.gas_resistance = 0;
  values.altitude = this->bme280.readAltitude(SEALEVELPRESSURE_HPA);
  return true;
}

#else

bool Octopus::readBme680(Bme680Values &values) {
  if(!bme680Ready)
    return false;


  if (!this->bme680.performReading()) { 
    Serial.println("Sensor reading failure");
    return false;
  } else {
    values.temperature = bme680.temperature;
    values.pressure = bme680.pressure;
    values.humidity = bme680.humidity;
    values.gas_resistance = bme680.gas_resistance;
    values.altitude = bme680.readAltitude(SEALEVELPRESSURE_HPA);
    return true;
  }
}

void Octopus::initBme680() {
  Printer::printMsg("Octopus", "Initializing BME680: ");
  if (this->bme680.begin(0x76)) {
    this->bme680.setTemperatureOversampling(BME680_OS_8X);
    this->bme680.setHumidityOversampling(BME680_OS_2X);
    this->bme680.setPressureOversampling(BME680_OS_4X);
    this->bme680.setIIRFilterSize(BME680_FILTER_SIZE_3);
    this->bme680.setGasHeater(320, 150); // 320*C for 150 ms
    bme680Ready = true;
    Serial.println("OK");
  } else {
    bme680Ready = false;
    Serial.println("Not found");
  }
}

#endif

void Octopus::initBno055() {
  Printer::printMsg("Octopus", "Initializing BNO055: ");
  if (this->bno055.begin()) {
    this->bno055.setExtCrystalUse(true);
    bno055Ready = true;
    Serial.println("OK");
  } else {
    bno055Ready = false;
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
