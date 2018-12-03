/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
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
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 */
package com.bosch.iot.things.example.octopus.api.things.model;

import static com.bosch.iot.things.example.octopus.api.things.ConfigurationProperties.getPropertyOrThrowException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.eclipse.ditto.model.things.Feature;
import org.eclipse.ditto.model.things.Thing;

public class OctopusFactory {

    public static final String THING_ID = getPropertyOrThrowException("solution.namespace") + ":octopus";

    private OctopusFactory() { }

    public static Thing newInstance() {

        List<Feature> features = new ArrayList<>();

        features.add(buildFeature("Power_0"));
        features.addAll(buildBme680Features());
        features.addAll(buildBNO055Features());

        return Thing.newBuilder()
                .setFeatures(features)
                .setId(THING_ID)
                .setPolicyId(PolicyFactory.POLICY_ID)
                .build();
    }

    private static List<Feature> buildBme680Features() {
        return Arrays.asList(
                buildFeature("HumiditySensor_BME680"),
                buildFeature("TemperatureSensor_BME680"),
                buildFeature("Barometer_BME680"));
    }


    private static List<Feature> buildBNO055Features() {
        return Arrays.asList(
                buildFeature("TemperatureSensor_BNO055"),
                buildFeature("Accelerometer_BNO055"),
                buildFeature("AbsoluteOrientation_BNO055"),
                buildFeature("Gravity_BNO055"),
                buildFeature("AngularVelocity_BNO055"),
                buildFeature("LinearAcceleration_BNO055"),
                buildFeature("Magnetometer_BNO055"));
    }

    private static Feature buildFeature(String id) {
        return Feature.newBuilder()
                .withId(id)
                .build();
    }
}
