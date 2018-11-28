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

float humidityMin = 1E+20;
float humidityMax = 1E-20;
float tempMin = 1E+20;
float tempMax = 1E-20;
float barometerMin = 1E+20;
float barometerMax = 1E-20;
float powerMin = 1E+20;
float powerMax = 1E-20;
float tempBnoMin = 1E+20;
float tempBnoMax = 1E-20;

String publishSensorDataString(float power, const Bme680Values &bme680Values, const Bno055Values &bno055Values)
{
  String output = "{\"topic\": \"";
  output += THINGS_NAMESPACE;
  output += "/";
  output += THING_ID;
  output += "/things/twin/commands/modify\",\"headers\": {\"response-required\": false, \"content-type\":\"application/vnd.eclipse.ditto+json\"},";
  output += "\"path\": \"/features\", \"value\":{";
  output += sensorMinMaxValueString("Power_0", power, powerMin, powerMax, "V") += ",";
  output += sensorMinMaxValueString("HumiditySensor_BME680", bme680Values.humidity, humidityMin, humidityMax, "%") += ",";
  output += sensorMinMaxValueString("TemperatureSensor_BME680", bme680Values.temperature, tempMin, tempMax, "°C") += ",";
  output += sensorMinMaxValueString("Barometer_BME680", bme680Values.pressure / 100.0, barometerMin, barometerMax, "hPa") += ",";
  output += sensorMinMaxValueString("TemperatureSensor_BNO055", bno055Values.temperature, tempBnoMin, tempBnoMax, "°C") += ",";
  output += sensor3dValueString("Accelerometer_BNO055", bno055Values.accelerationX, bno055Values.accelerationY, bno055Values.accelerationZ, "m/s^2") += ",";
  output += sensor3dValueString("AbsoluteOrientation_BNO055", bno055Values.orientationX, bno055Values.orientationY, bno055Values.orientationZ, "°") += ",";
  output += sensor3dValueString("Gravity_BNO055", bno055Values.gravityX, bno055Values.gravityY, bno055Values.gravityZ, "m/s^2") += ",";
  output += sensor3dValueString("AngularVelocity_BNO055", bno055Values.angularVelocityX, bno055Values.angularVelocityY, bno055Values.angularVelocityZ, "rad/s") += ",";
  output += sensor3dValueString("LinearAcceleration_BNO055", bno055Values.LinearAccelerationX, bno055Values.LinearAccelerationY, bno055Values.LinearAccelerationZ, "m/s^2") += ",";
  output += sensor3dValueString("Magnetometer_BNO055", bno055Values.magneticFieldStrengthX, bno055Values.magneticFieldStrengthY, bno055Values.magneticFieldStrengthZ, "uT");
  output += "}}";
  return output;
}

String sensorMinMaxValueString(const String &featureName, float sensorValue, float minValue, float maxValue, const String &units)
{
  String output = "\"" + featureName + "\": { \"properties\": { \"status\":";
  output += "{\"sensorValue\": ";
  output += sensorValue;
  output += ", \"minMeasuredValue\": ";
  output += minValue;
  output += ", \"maxMeasuredValue\": ";
  output += maxValue;
  output += ", \"sensorUnits\": \"";
  output += units;
  output += "\"}}}";
  return output;
}

String sensor3dValueString(const String &featureName, float xValue, float yValue, float zValue, const String &units)
{
  String output = "\"" + featureName + "\": { \"properties\": { \"status\":";
  output += "{\"xValue\": ";
  output += xValue;
  output += ", \"yValue\": ";
  output += yValue;
  output += ", \"zValue\": ";
  output += zValue;
  output += ", \"sensorUnits\": \"";
  output += units;
  output += "\"}}}";
  return output;
}

void publishSensorData(float power, const Bme680Values &bme680Values, const Bno055Values &bno055Values)
{

  updateMinMax(power, bme680Values, bno055Values);
  hub.publish(publishSensorDataString(power, bme680Values, bno055Values));
}

void updateMinMax(float power, const Bme680Values &bme680Values, const Bno055Values &bno055Values)
{
  if (powerMin > power)
  {
    powerMin = power;
  }
  if (powerMax < power)
  {
    powerMax = power;
  }

  float humidity = bme680Values.humidity;
  if (humidityMin > humidity)
  {
    humidityMin = humidity;
  }
  if (humidityMax < humidity)
  {
    humidityMax = humidity;
  }

  float temp = bme680Values.temperature;
  if (tempMin > temp)
  {
    tempMin = temp;
  }
  if (tempMax < temp)
  {
    tempMax = temp;
  }

  float barometer = bme680Values.pressure / 100.0;
  if (barometerMin > barometer)
  {
    barometerMin = barometer;
  }
  if (barometerMax < barometer)
  {
    barometerMax = barometer;
  }

  float tempBno = bno055Values.temperature;
  if (tempBnoMin > tempBno)
  {
    tempBnoMin = tempBno;
  }
  if (tempBnoMax < tempBno)
  {
    tempBnoMax = tempBno;
  }
}
