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
#include "settings.h"
#include "printer.h"
#include "octopus.h"
#include "boschIotHub.h"


ADC_MODE(ADC_VCC); // enable reading in VCC of ESP8266

Octopus octopus;
BoschIotHub hub(MQTT_BROKER, MQTT_PORT, mqtt_server_ca, mqtt_server_ca_len);

unsigned long lastSensorUpdateMillis = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("                             "); // print some spaces to let the Serial Monitor catch up
  Serial.println();
  
  Printer::printlnMsg("Reset reason", ESP.getResetReason());
  
  octopus.begin();
  octopus.connectToWifi(WIFI_SSID, WIFI_PASSWORD);

  if(!hub.connect()) {
    Printer::printlnMsg("Error", "Could not connect to Hub. Restarting octopus");
    ESP.restart();
  }

  Serial.println();    
}

void loop() {
  if(!hub.deviceIsConnected()) {
    octopus.showColor(1, 0x80, 0, 0, 0); // red
    hub.connectDevice(HUB_DEVICE_ID, HUB_DEVICE_AUTH_ID "@" HUB_TENANT, HUB_DEVICE_PASSWORD);
    octopus.showColor(1, 0, 0x80, 0, 0); // green
  }

  if (millis() - lastSensorUpdateMillis > SENSOR_UPDATE_RATE_MS) {
    lastSensorUpdateMillis = millis();
    Bme680Values bme680Values = octopus.readBme680();
    Bno055Values bno055Values = octopus.readBno055();
    float vcc = octopus.getVcc();

    printSensorData(vcc, bme680Values, bno055Values);
    publishSensorData(vcc, bme680Values, bno055Values);
    Serial.println();
  }
  delay(LOOP_DELAY);
}
