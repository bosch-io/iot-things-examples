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
#include <Arduino.h>
#include "boschIotHub.h"
#include "printer.h"

BoschIotHub::BoschIotHub(const char* mqttBroker_, const int mqttPort_, const char* mqttServerFingerprint_) 
  : mqttBroker(mqttBroker_), mqttPort(mqttPort_), mqttServerFingerprint(mqttServerFingerprint_) {
}

void BoschIotHub::connect() {
  mqttClient.setServer(mqttBroker, mqttPort);
  if (!wiFiClient.connect(mqttBroker, mqttPort)) {
    Printer::printlnMsg("Bosch IoT Hub", "Connect failed, will restart");
    /* Secure connection failed, start over */
    ESP.restart();
  } else {
    Printer::printlnMsg("Bosch IoT Hub", "Secure connection established"); 
  }
         
  if (!wiFiClient.verify(mqttServerFingerprint, mqttBroker)) {
    Printer::printlnMsg("Bosch IoT Hub", "Failed to verify certificate, restarting");
    /* Verify failed, start over */
    ESP.restart();
  } else {
    Printer::printlnMsg("Bosch IoT Hub", "Server certificate verified"); 
  } 
}

bool BoschIotHub::deviceIsConnected() {
  return mqttClient.connected();
}

void BoschIotHub::connectDevice(const char* deviceId, const char* authId, const char* devicePassword) {
    Printer::printMsg("Bosch IoT Hub", "Broker login");        
    
    while (!deviceIsConnected())
    {
        Serial.print(".");
        /* If connected to the MQTT broker... */
        if (mqttClient.connect(deviceId, authId, devicePassword))
        {
            Serial.println("OK");
        } else {
            /* otherwise wait for 1 second before retrying */
            delay(1000);
        }
    }
    
    mqttClient.loop();
}

void BoschIotHub::publish(String payload) {
  Printer::printlnMsg("Bosch IoT Hub", payload);
  /* Publish all available data to the MQTT broker */
  int publishResult = mqttClient.publish("telemetry", payload.c_str());
  if (!publishResult) {
    Printer::printlnMsg("Bosch IoT Hub", "Publish failed, if this happens repeatedly increase MQTT_MAX_PACKET_SIZE in PubSubClient.h");
  }   
}
