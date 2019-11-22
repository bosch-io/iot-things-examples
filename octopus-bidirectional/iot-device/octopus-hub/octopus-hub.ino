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
unsigned int sensorUpdateRate = SENSOR_UPDATE_RATE_MS;

void setup()
{
  Serial.begin(115200);
  while (!Serial)
    ;

  Serial.println("                             "); // print some spaces to let the Serial Monitor catch up
  Serial.println();

  Printer::printlnMsg("Reset reason", ESP.getResetReason());

  octopus.begin();
  octopus.connectToWifi(WIFI_SSID, WIFI_PASSWORD);

  if (!hub.connect())
  {
    Printer::printlnMsg("Error", "Could not connect to Hub. Restarting octopus");
    ESP.restart();
  }

  Serial.println();
}

void customMessageHandler(JsonObject &root, String command, String replyTopic)
{
  const char *dittoTopic = root["topic"];
  JsonObject &headers = root["headers"];

  Serial.println(command);

  if (command.equals("switch_led"))
  {
    JsonObject &value = root["value"];
    const char red = value["r"];
    const char green = value["g"];
    const char blue = value["b"];
    const char white = value["w"];
    octopus.showColor(0, red, green, blue, white);
    octopus.showColor(1, red, green, blue, white);

    root["value"] = "\"Command '" + command + "' executed\"";
    root["status"] = 200;
  }
  else if (command.equals("change_update_rate"))
  {
    sensorUpdateRate = root["value"];

    root["value"] = "\"Command '" + command + "' executed\"";
    root["status"] = 200;
  }
  else
  {
    root["value"] = "\"Command unknown: '" + command + "'\"";
    root["status"] = 404;
  }

  String output;
  root.printTo(output);
  String replyTopicAndStatusCode = replyTopic + "200";
  hub.publish(replyTopicAndStatusCode.c_str(), output);
}

void loop()
{
  if (!hub.deviceIsConnected())
  {
    octopus.showColor(1, 0x80, 0, 0, 0); // red
    hub.connectDevice(HUB_DEVICE_ID, HUB_DEVICE_AUTH_ID "@" HUB_TENANT, HUB_DEVICE_PASSWORD);
    octopus.showColor(1, 0, 0x80, 0, 0); // green
    hub.subscribe("command/+/+/req/#");
    hub.subscribe("command///req/#"); // TODO: switch to this after Hono 1.0
    hub.registerOnDittoProtocolMessage(customMessageHandler);
  }

  if (millis() - lastSensorUpdateMillis > sensorUpdateRate)
  {
    lastSensorUpdateMillis = millis();
    static Bme680Values bme680Values;
    static Bno055Values bno055Values;
    memset(&bme680Values, 0, sizeof(bme680Values));
    memset(&bno055Values, 0, sizeof(bno055Values));
    octopus.readBno055(bno055Values);
#ifdef BME280
    octopus.readBme280(bme680Values);
#else
    octopus.readBme680(bme680Values);
#endif
    float vcc = octopus.getVcc();

    //printSensorData(vcc, bme680Values, bno055Values);
    publishSensorData(vcc, bme680Values, bno055Values);
  }
  hub.loop();
  delay(LOOP_DELAY);
}
