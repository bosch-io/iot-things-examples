/*
 *                          Bosch.IO Example Code License
 *                            Version 1.1, May 2020
 *
 * Copyright 2020 Bosch.IO GmbH (“Bosch.IO”). All rights reserved.
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
 * BOSCH.IO PROVIDES THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH.IO HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH.IO SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH.IO SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH.IO IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH.IO AND THE PERSONAL LIABILITY OF BOSCH.IO’S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 *
 */

class SensorStatistics {
  constructor (config) {
    this.namespace = config.THINGS_NAMESPACE;
    this.name = config.THING_NAME;

    this.humidityMin = 1e+20;
    this.humidityMax = 1e-20;
    this.tempMin = 1e+20;
    this.tempMax = 1e-20;
    this.barometerMin = 1e+20;
    this.barometerMax = 1e-20;
    this.gasMin = 1e+20;
    this.gasMax = 1e-20;
    this.powerMin = 1e+20;
    this.powerMax = 1e-20;
    this.tempBnoMin = 1e+20;
    this.tempBnoMax = 1e-20;
    this.altitudeMin = 1e+20;
    this.altitudeMax = 1e-20;
  }

  createFeaturePropertyUpdateCommands (power, bmeValues, bnoValues, ledValues) {
    this.updateMinMax(power, bmeValues, bnoValues);
    const commands = [];
    commands.push(this.createModifyFeaturePropertiesMsg('voltage', this.createSensorMinMaxFeatureProperties(power, this.powerMin, this.powerMax, 'V')));
    commands.push(this.createModifyFeaturePropertiesMsg('humidity', this.createSensorMinMaxFeatureProperties(bmeValues.humidity, this.humidityMin, this.humidityMax, '%')));
    commands.push(this.createModifyFeaturePropertiesMsg('temperature', this.createSensorMinMaxFeatureProperties(bmeValues.temperature, this.tempMin, this.tempMax, '°C')));
    commands.push(this.createModifyFeaturePropertiesMsg('pressure', this.createSensorMinMaxFeatureProperties(bmeValues.pressure / 100.0, this.barometerMin, this.barometerMax, 'hPa')));
    commands.push(this.createModifyFeaturePropertiesMsg('gas_resistance', this.createSensorMinMaxFeatureProperties(bmeValues.gas_resistance, this.gasMin, this.gasMax, 'KOhms')));
    commands.push(this.createModifyFeaturePropertiesMsg('altitude', this.createSensorMinMaxFeatureProperties(bmeValues.altitude, this.altitudeMin, this.altitudeMax, 'M')));
    commands.push(this.createModifyFeaturePropertiesMsg('ambient_temperature', this.createSensorMinMaxFeatureProperties(bnoValues.temperature, this.tempBnoMin, this.tempBnoMax, '°C')));

    commands.push(this.createModifyFeaturePropertiesMsg('acceleration', this.createSensor3dFeatureProperties(bnoValues.acceleration.x, bnoValues.acceleration.y, bnoValues.acceleration.z, 'm/s^2')));
    commands.push(this.createModifyFeaturePropertiesMsg('orientation', this.createSensor3dFeatureProperties(bnoValues.orientation.x, bnoValues.orientation.y, bnoValues.orientation.z, '°')));
    commands.push(this.createModifyFeaturePropertiesMsg('gravity', this.createSensor3dFeatureProperties(bnoValues.gravity.x, bnoValues.gravity.y, bnoValues.gravity.z, 'm/s^2')));
    commands.push(this.createModifyFeaturePropertiesMsg('angular_velocity', this.createSensor3dFeatureProperties(bnoValues.angular_velocity.x, bnoValues.angular_velocity.y, bnoValues.angular_velocity.z, 'rad/s')));
    commands.push(this.createModifyFeaturePropertiesMsg('linear_acceleration', this.createSensor3dFeatureProperties(bnoValues.LinearAcceleration.x, bnoValues.LinearAcceleration.y, bnoValues.LinearAcceleration.z, 'V')));
    commands.push(this.createModifyFeaturePropertiesMsg('magnetometer', this.createSensor3dFeatureProperties(bnoValues.magneticFieldStrength.x, bnoValues.magneticFieldStrength.y, bnoValues.magneticFieldStrength.z, 'V')));
    commands.push(this.createModifyFeaturePropertiesMsg('led', this.createLedFeatureProperties(ledValues)));
    return commands;
  }

  createSensorMinMaxFeatureProperties (sensorValue, minMeasuredValue, maxMeasuredValue, sensorUnits) {
    return {
      status: {
        sensorValue,
        minMeasuredValue,
        maxMeasuredValue,
        sensorUnits
      }
    };
  }

  createSensor3dFeatureProperties (xValue, yValue, zValue, sensorUnits) {
    return {
      status: {
        xValue,
        yValue,
        zValue,
        sensorUnits
      }
    };
  }

  createLedFeatureProperties (ledValues) {
    return {
      status: ledValues
    };
  }

  updateMinMax (power, bmeValues, bnoValues) {
    if (this.powerMin > power) {
      this.powerMin = power;
    }
    if (this.powerMax < power) {
      this.powerMax = power;
    }

    const humidity = bmeValues.humidity;
    if (this.humidityMin > humidity) {
      this.humidityMin = humidity;
    }
    if (this.humidityMax < humidity) {
      this.humidityMax = humidity;
    }

    const temp = bmeValues.temperature;
    if (this.tempMin > temp) {
      this.tempMin = temp;
    }
    if (this.tempMax < temp) {
      this.tempMax = temp;
    }

    const barometer = bmeValues.pressure / 100.0;
    if (this.barometerMin > barometer) {
      this.barometerMin = barometer;
    }
    if (this.barometerMax < barometer) {
      this.barometerMax = barometer;
    }

    const tempBno = bnoValues.temperature;
    if (this.tempBnoMin > tempBno) {
      this.tempBnoMin = tempBno;
    }
    if (this.tempBnoMax < tempBno) {
      this.tempBnoMax = tempBno;
    }

    const altitude = bmeValues.altitude;
    if (this.altitudeMin > altitude) {
      this.altitudeMin = altitude;
    }
    if (this.altitudeMax < altitude) {
      this.altitudeMax = altitude;
    }

    const gas = bmeValues.gas_resistance / 1000.0;
    if (this.gasMin > gas) {
      this.gasMin = gas;
    }
    if (this.gasMax < gas) {
      this.gasMax = gas;
    }
  }

  createModifyFeaturePropertiesMsg (featureName, featureProperties) {
    return {
      topic: `${this.namespace}/${this.name}/things/twin/commands/modify`,
      headers: {
        'response-required': false,
        'content-type': 'application/vnd.eclipse.ditto+json'
      },
      path: `/features/${featureName}/properties`,
      value: featureProperties
    };
  }
}

module.exports = SensorStatistics;
