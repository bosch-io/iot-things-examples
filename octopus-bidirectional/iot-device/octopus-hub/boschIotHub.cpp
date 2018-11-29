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

#define MSG_LENGTH 4096

StaticJsonBuffer<MSG_LENGTH> jsonBuffer;

BoschIotHub::BoschIotHub(const char* mqttBroker_, const int mqttPort_, const unsigned char* mqttServerCA_, const unsigned int mqttServerCALen_)
  : mqttBroker(mqttBroker_), mqttPort(mqttPort_), mqttServerCA(mqttServerCA_), mqttServerCALen(mqttServerCALen_) {
}

void (*onDittoProtocolMessage)(JsonObject&,String,String);

void BoschIotHub::registerOnDittoProtocolMessage(HUB_COMMAND_CALLBACK_SIGNATURE) {
  onDittoProtocolMessage = callback;
}

void hubCommandReceived(char* topic, byte* payload, unsigned int length) {
  Printer::printMsg("Bosch IoT Hub", "Received command on topic: ");
  Serial.println(topic);

  String topicStr = String(topic);
  topicStr.replace("control///req/","");
  String replyTopic = "control///res/" + topicStr.substring(0, topicStr.lastIndexOf("/")) + "/";
  String command = topicStr.substring(topicStr.lastIndexOf("/")+1, topicStr.length());

  // Allocate the correct amount of memory for the payload copy
  byte* p = (byte*)malloc(length);
  // Copy the payload to the new buffer
  memcpy(p,payload,length);  
  JsonObject& root = jsonBuffer.parseObject(p);

  if (root.size() > 0 && root.containsKey("topic") && root.containsKey("path")) {
    if (onDittoProtocolMessage) {
      onDittoProtocolMessage(root, command, replyTopic);  
    } else {
      Serial.println("onDittoProtocolMessage function is not defined");
    }
  } else if(!root.containsKey("topic")) {
    Serial.println("[error] - Invalid JSON Object.");
  }
  // Free the memory
  free(p);
  jsonBuffer.clear();
}

bool BoschIotHub::connect() {
  mqttClient.setServer(mqttBroker, mqttPort);
  mqttClient.setCallback(hubCommandReceived);
  if (!wiFiClient.connect(mqttBroker, mqttPort)) {
    Printer::printlnMsg("Bosch IoT Hub", "Connect failed.");
    return false;
  } else {
    Printer::printlnMsg("Bosch IoT Hub", "Secure connection established"); 
  }

  if(!wiFiClient.setCACert(mqttServerCA, mqttServerCALen)){
    Printer::printlnMsg("Bosch IoT Hub", "Cannot load root certificate");
    return false;
  }

  int rc = wiFiClient.verifyCertChain(mqttBroker);
  if (!rc) {
    Printer::printlnMsg("Bosch IoT Hub", "Failed to verify certificate");
    return false;
  } else {
    Printer::printlnMsg("Bosch IoT Hub", "Server certificate verified"); 
  }

  return true;
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

void BoschIotHub::publish(const char* topic, String payload) {
  Printer::printMsg("Bosch IoT Hub", "Publishing on topic: ");
  Serial.println(topic);
  Printer::printlnMsg("Bosch IoT Hub", payload);

  const size_t requiredLength = 5 + 2+strlen(topic) + payload.length();

  if (requiredLength > MQTT_MAX_PACKET_SIZE) {
    Printer::printlnMsg("Bosch IoT Hub", "Cannot publish: Message is too big.");
    Printer::printMsg("Bosch IoT Hub", "Increase MQTT_MAX_PACKET_SIZE in PubSubClient.h to at least ");
    Serial.println(requiredLength);
  }

  int publishResult = mqttClient.publish(topic, payload.c_str());
  if (!publishResult) {
    Printer::printMsg("Bosch IoT Hub", "Publish failed");
    Serial.println(publishResult);
  }
}

void BoschIotHub::publish(String payload) {
  const char* topic = "telemetry";
  this->publish(topic, payload);
}

void BoschIotHub::subscribe(const char* topic) {
  Printer::printMsg("Bosch IoT Hub", "Subscribing to topic: ");
  Serial.println(topic);
  mqttClient.subscribe(topic);
}

void BoschIotHub::loop() {
  mqttClient.loop();
}
