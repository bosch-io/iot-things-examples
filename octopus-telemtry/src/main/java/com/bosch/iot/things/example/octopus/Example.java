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
package com.bosch.iot.things.example.octopus;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryApi;
import com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryApiImpl;
import com.bosch.iot.things.example.octopus.api.hub.model.CredentialsFactory;
import com.bosch.iot.things.example.octopus.api.hub.model.RegistrationFactory;
import com.bosch.iot.things.example.octopus.api.things.ThingsApi;
import com.bosch.iot.things.example.octopus.api.things.ThingsApiImpl;
import com.bosch.iot.things.example.octopus.api.things.model.OctopusFactory;
import com.bosch.iot.things.example.octopus.api.things.model.PolicyFactory;
import com.bosch.iot.things.example.octopus.utils.HttpUtils;

public class Example {

    private static final Logger LOGGER = LoggerFactory.getLogger(Example.class);

    private static final ThingsApi THINGS_API = new ThingsApiImpl();

    private static final HubDeviceRegistryApi HUB_API = new HubDeviceRegistryApiImpl();

    public static void main(String[] args) throws IOException {

        cleanUp();
        THINGS_API.registerPolicy(PolicyFactory.newInstance());
        LOGGER.info("Created policy with ID '{}' in Bosch IoT Things", PolicyFactory.POLICY_ID);

        THINGS_API.registerThing(OctopusFactory.newInstance());
        LOGGER.info("Created octopus twin with ID '{}' in Bosch IoT Things", OctopusFactory.THING_ID);

        HUB_API.addDeviceRegistration(RegistrationFactory.newInstance());
        LOGGER.info("Registered device with ID '{}' in Bosch IoT Hub", RegistrationFactory.HUB_DEVICE_ID);

        HUB_API.addDeviceCredentials(CredentialsFactory.newInstance());
        LOGGER.info("Registered device credentials for device with ID '{}' at Bosch IoT Hub", RegistrationFactory
                .HUB_DEVICE_ID);

        LOGGER.info("===============================");
        LOGGER.info("Credentials:");
        LOGGER.info("Device Auth-Id: {}", CredentialsFactory.HUB_DEVICE_AUTH_ID);
        LOGGER.info("Device Password: {}", CredentialsFactory.HUB_DEVICE_PASSWORD);
        LOGGER.info("===============================");

        HttpUtils.getConfiguredHttpClient().close();
    }

    private static void cleanUp() {
        THINGS_API.deleteThing(OctopusFactory.THING_ID);
        LOGGER.info("Ensured that no thing with ID '{}' exists.", OctopusFactory.THING_ID);

        THINGS_API.deletePolicy(PolicyFactory.POLICY_ID);
        LOGGER.info("Ensured that no policy with ID '{}' exists.", PolicyFactory.POLICY_ID);

        HUB_API.deleteDeviceCredentials(RegistrationFactory.HUB_DEVICE_ID, CredentialsFactory.HUB_DEVICE_AUTH_ID);
        LOGGER.info("Ensured that no credentials for device with ID '{}' exist in Bosch IoT Hub",
                RegistrationFactory.HUB_DEVICE_ID);

        HUB_API.deleteDeviceRegistration(RegistrationFactory.HUB_DEVICE_ID);
        LOGGER.info("Ensured that no device with ID '{}' is registered at Bosch IoT Hub",
                RegistrationFactory.HUB_DEVICE_ID);
    }
}
