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

BoschIotHub::BoschIotHub(const char *mqttBroker_, const int mqttPort_, const unsigned char *mqttServerCA_, const unsigned int mqttServerCALen_)
    : mqttBroker(mqttBroker_), mqttPort(mqttPort_), mqttServerCA(mqttServerCA_), mqttServerCALen(mqttServerCALen_)
{
}

bool BoschIotHub::connect()
{
  mqttClient.setServer(mqttBroker, mqttPort);
  if (!wiFiClient.connect(mqttBroker, mqttPort))
  {
    Printer::printlnMsg("Bosch IoT Hub", "Connect failed.");
    return false;
  }
  else
  {
    Printer::printlnMsg("Bosch IoT Hub", "Secure connection established");
  }

  if (!wiFiClient.setCACert(mqttServerCA, mqttServerCALen))
  {
    Printer::printlnMsg("Bosch IoT Hub", "Cannot load root certificate");
    return false;
  }
  const char *test_priv_ca =
      "-----BEGIN CERTIFICATE-----\n"
      "MIIDSjCCAjKgAwIBAgIQRK+wgNajJ7qJMDmGLvhAazANBgkqhkiG9w0BAQUFADA/\n"
      "MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT\n"
      "DkRTVCBSb290IENBIFgzMB4XDTAwMDkzMDIxMTIxOVoXDTIxMDkzMDE0MDExNVow\n"
      "PzEkMCIGA1UEChMbRGlnaXRhbCBTaWduYXR1cmUgVHJ1c3QgQ28uMRcwFQYDVQQD\n"
      "Ew5EU1QgUm9vdCBDQSBYMzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\n"
      "AN+v6ZdQCINXtMxiZfaQguzH0yxrMMpb7NnDfcdAwRgUi+DoM3ZJKuM/IUmTrE4O\n"
      "rz5Iy2Xu/NMhD2XSKtkyj4zl93ewEnu1lcCJo6m67XMuegwGMoOifooUMM0RoOEq\n"
      "OLl5CjH9UL2AZd+3UWODyOKIYepLYYHsUmu5ouJLGiifSKOeDNoJjj4XLh7dIN9b\n"
      "xiqKqy69cK3FCxolkHRyxXtqqzTWMIn/5WgTe1QLyNau7Fqckh49ZLOMxt+/yUFw\n"
      "7BZy1SbsOFU5Q9D8/RhcQPGX69Wam40dutolucbY38EVAjqr2m7xPi71XAicPNaD\n"
      "aeQQmxkqtilX4+U9m5/wAl0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNV\n"
      "HQ8BAf8EBAMCAQYwHQYDVR0OBBYEFMSnsaR7LHH62+FLkHX/xBVghYkQMA0GCSqG\n"
      "SIb3DQEBBQUAA4IBAQCjGiybFwBcqR7uKGY3Or+Dxz9LwwmglSBd49lZRNI+DT69\n"
      "ikugdB/OEIKcdBodfpga3csTS7MgROSR6cz8faXbauX+5v3gTt23ADq1cEmv8uXr\n"
      "AvHRAosZy5Q6XkjEGB5YGV8eAlrwDPGxrancWYaLbumR9YbK+rlmM6pZW87ipxZz\n"
      "R8srzJmwN0jP41ZL9c8PDHIyh8bwRLtTcm1D9SZImlJnt1ir/md2cXjbDaJWFBM5\n"
      "JDGFoqgCWjBH4d1QB7wCCZAA62RjYJsWvIjJEubSfZGL+T0yjWW06XyxV3bqxbYo\n"
      "Ob8VZRzI9neWagqNdwvYkQsEjgfbKbYK7p2CNTUQ\n"
      "-----END CERTIFICATE-----\n";

  // if (!wiFiClient.setCertificate(test_priv_ca))
  // {
  //   Printer::printlnMsg("Bosch IoT Hub", "Cannot load private certificate");
  //   return false;
  // }

  Printer::printlnMsg("Bosch IoT Hub", "Starting connection ...");
  if (!wiFiClient.connect(mqttBroker, 8883))
  {
    Printer::printlnMsg("Bosch Iot Hub", "Connection failed.");
  }
  else
  {
    Printer::printlnMsg("Bosch IoT Hub", "Connected to MQTT Broker.");
  }

  // int rc = wiFiClient.verifyCertChain(mqttBroker);
  // if (!rc) {
  //   Printer::printlnMsg("Bosch IoT Hub", "Failed to verify certificate");
  //   return false;
  // } else {
  //   Printer::printlnMsg("Bosch IoT Hub", "Server certificate verified");
  // }

  return true;
}

bool BoschIotHub::deviceIsConnected()
{
  return mqttClient.connected();
}

void BoschIotHub::connectDevice(const char *deviceId, const char *authId, const char *devicePassword)
{
  Printer::printMsg("Bosch IoT Hub", "Broker login");

  while (!deviceIsConnected())
  {
    Serial.print(".");
    /* If connected to the MQTT broker... */
    if (mqttClient.connect(deviceId, authId, devicePassword))
    {
      Serial.println("OK");
    }
    else
    {
      /* otherwise wait for 1 second before retrying */
      delay(1000);
    }
  }

  mqttClient.loop();
}

void BoschIotHub::publish(String payload)
{
  Printer::printlnMsg("Bosch IoT Hub", payload);
  /* Publish all available data to the MQTT broker */
  const char *topic = "telemetry";
  const size_t requiredLength = 5 + 2 + strlen(topic) + payload.length();

  if (requiredLength > MQTT_MAX_PACKET_SIZE)
  {
    Printer::printlnMsg("Bosch IoT Hub", "Cannot publish: Message is too big.");
    Printer::printMsg("Bosch IoT Hub", "Increase MQTT_MAX_PACKET_SIZE in PubSubClient.h to at least ");
    Serial.println(requiredLength);
  }

  int publishResult = mqttClient.publish(topic, payload.c_str());
  if (!publishResult)
  {
    Printer::printMsg("Bosch IoT Hub", "Publish failed");
    Serial.println(publishResult);
  }
}
