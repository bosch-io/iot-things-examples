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
#ifndef OCTOPUS_H
#define OCTOPUS_H

#include <Adafruit_Sensor.h>  // Make sure you have the Adafruit Sensor library installed
#include <Adafruit_BME680.h>  // Make sure you have the Adafruit BME680 library installed
#include <Adafruit_BNO055.h>  // Make sure you have the Adafruit BNO055 library installed
#include <utility/imumaths.h>
#include <Adafruit_NeoPixel.h> // Make sure you have the Adafruit NeoPixel library installed

#define PIN_NEOPIXEL      13
#define SEALEVELPRESSURE_HPA (1013.25)

struct Bno055Values {
  float temperature;
  float accelerationX;
  float accelerationY;
  float accelerationZ;
  float orientationX;
  float orientationY;
  float orientationZ;
  float angularVelocityX;
  float angularVelocityY;
  float angularVelocityZ;
  float LinearAccelerationX;
  float LinearAccelerationY;
  float LinearAccelerationZ;
  float magneticFieldStrengthX;
  float magneticFieldStrengthY;
  float magneticFieldStrengthZ;
  float gravityX;
  float gravityY;
  float gravityZ;
  uint8_t calibrationSys;
  uint8_t calibrationGyro;
  uint8_t calibrationAccel;
  uint8_t calibrationMag;
};

struct Bme680Values {
  float temperature;
  float pressure;
  float humidity;
  float gas_resistance;
  float altitude;
};

class Octopus {
 
  Adafruit_BME680 bme680; // I2C
  Adafruit_BNO055 bno055 = Adafruit_BNO055(55);
  Adafruit_NeoPixel strip = Adafruit_NeoPixel(2, PIN_NEOPIXEL, NEO_GRBW + NEO_KHZ800);
  
  void initLights();
  void initBme680();
  void initBno055();
  
  public:
    Octopus();
    void connectToWifi(char* ssid, const char* password);
    void showColor(char led, char red, char green, char blue, char white);
    float getVcc ();
    Bno055Values readBno055();
    Bme680Values readBme680();
};

#endif
