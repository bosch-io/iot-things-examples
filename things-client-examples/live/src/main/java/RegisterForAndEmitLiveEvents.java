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

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.cr.integration.IntegrationClient;
import com.bosch.cr.json.JsonObject;
import com.bosch.cr.json.JsonValue;

/**
 * This example shows how the {@link com.bosch.cr.integration.live.Live Live} client can be used to register for and
 * emit live changes.
 */
public class RegisterForAndEmitLiveEvents extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForAndEmitLiveEvents.class);

    private final IntegrationClient backendClient;
    private final IntegrationClient clientAtDevice;

    private final String thingId = SOLUTION_DEFAULT_NAMESPACE + ":live1";

    public RegisterForAndEmitLiveEvents() throws Exception {
        backendClient = client;
        clientAtDevice = client2;
    }

    public void registerForAndEmitLiveEvents() {

        LOGGER.info("[AT BACKEND] register for LIVE attribute changes of attribute 'location'..");
        backendClient.live()
                .registerForAttributeChanges("locationHandler", "location", change -> {
                    change.getThingId();
                    LOGGER.info("[AT BACKEND] Received change of attribute 'location': {}",
                            change.getValue().orElse(null));
                });
        LOGGER.info("[AT BACKEND] register for LIVE feature property changes of feature 'lamp'..");
        backendClient.live()
                .forFeature(thingId, "lamp")
                .registerForPropertyChanges("lampPropertiesHandler", change -> {
                    LOGGER.info("[AT BACKEND] Received change of Feature 'lamp' property '{}': {}", change.getPath(),
                            change.getValue().orElse(null));
                });

        try {
            backendClient.live().startConsumption().get(10, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            throw new IllegalStateException("Error creating Things Client.", e);
        }

        LOGGER.info("[AT DEVICE] Emitting LIVE event AttributeModified for attribute 'location'..");
        clientAtDevice.live()
                .forId(thingId)
                .emitEvent(thingEventFactory ->
                        thingEventFactory.attributeModified("location",
                                JsonObject.newBuilder()
                                        .set("longitude", 42.123)
                                        .set("latitude", 8.123)
                                        .build()
                        )
                );

        LOGGER.info("[AT DEVICE] Emitting LIVE event 'FeaturePropertyModified' for feature 'lamp', property 'on'..");
        clientAtDevice.live()
                .forId(thingId)
                .forFeature("lamp")
                .emitEvent(featureEventFactory ->
                        featureEventFactory.featurePropertyModified("on",
                                JsonValue.newInstance(true)
                        )
                );
    }

}
