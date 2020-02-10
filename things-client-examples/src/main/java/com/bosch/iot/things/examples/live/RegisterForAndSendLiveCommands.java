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
package com.bosch.iot.things.examples.live;

import static org.eclipse.ditto.model.things.ThingsModelFactory.allPermissions;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.client.DittoClient;
import org.eclipse.ditto.model.base.auth.AuthorizationModelFactory;
import org.eclipse.ditto.model.things.Permission;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingId;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.eclipse.ditto.signals.commands.live.modify.ModifyFeaturePropertyLiveCommandAnswerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.examples.common.ExamplesBase;

/**
 * This example shows how the {@link org.eclipse.ditto.client.DittoClient} can be used to register for, send,
 * and respond to {@link org.eclipse.ditto.client.live.Live} commands.
 */
public class RegisterForAndSendLiveCommands extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForAndSendLiveCommands.class);
    private static final String FEATURE_ID = "temp-sensor";

    private final String thingId;
    private final DittoClient backendClient;
    private final DittoClient clientAtDevice;
    private final CountDownLatch latch;

    public RegisterForAndSendLiveCommands() {
        thingId = generateRandomThingId("live_");
        backendClient = client;
        clientAtDevice = client2;
        latch = new CountDownLatch(2);
    }

    public static void main(final String... args) throws Exception {
        final RegisterForAndSendLiveCommands registerForAndSendLiveCommands = new RegisterForAndSendLiveCommands();
        try {
            registerForAndSendLiveCommands.registerForAndSendLiveCommands();
        } finally {
            registerForAndSendLiveCommands.terminate();
        }
    }

    public void registerForAndSendLiveCommands() throws InterruptedException, TimeoutException, ExecutionException {

        LOGGER.info("[AT BACKEND] create a Thing with required permissions: {}", thingId);
        backendClient.twin().create(ThingId.of(thingId)).thenCompose(created -> {
            final Thing updated =
                    created.toBuilder()
                            .setFeature(ThingsModelFactory.newFeature(FEATURE_ID))
                            .build();
            return backendClient.twin().update(updated);
        }).get(2, TimeUnit.SECONDS);

        LOGGER.info("[AT DEVICE] register handler for 'ModifyFeatureProperty' LIVE commands..");
        clientAtDevice.live()
                .forId(ThingId.of(thingId))
                .forFeature(FEATURE_ID)
                .handleModifyFeaturePropertyCommands(command -> {
                    LOGGER.info("[AT DEVICE] Received live command: {}", command.getType());
                    LOGGER.info("[AT DEVICE] Property to modify: '{}' to value: '{}'", command.getPropertyPointer(),
                            command.getPropertyValue());
                    LOGGER.info("[AT DEVICE] Answering ...");
                    latch.countDown();
                    return command.answer()
                            .withResponse(ModifyFeaturePropertyLiveCommandAnswerBuilder.ResponseFactory::modified)
                            .withEvent(ModifyFeaturePropertyLiveCommandAnswerBuilder.EventFactory::modified);
                });

        try {
            clientAtDevice.live().startConsumption().get(10, TimeUnit.SECONDS);
            backendClient.live().startConsumption().get(10, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            throw new IllegalStateException("Error creating Things Client.", e);
        }

        LOGGER.info("[AT BACKEND] put 'temperature' property of 'temp-sensor' LIVE Feature..");
        backendClient.live()
                .forFeature(ThingId.of(thingId), FEATURE_ID)
                .putProperty("temperature", 23.21)
                .whenComplete(((_void, throwable) -> {
                    if (throwable != null) {
                        LOGGER.error("[AT BACKEND] Received error when putting the property: ",
                                throwable.getMessage(), throwable);
                    } else {
                        LOGGER.info("[AT BACKEND] Putting the property succeeded");
                    }
                    latch.countDown();
                })).get(10, TimeUnit.SECONDS);

        if (latch.await(10, TimeUnit.SECONDS)) {
            LOGGER.info("Received all expected events!");
        } else {
            LOGGER.info("Did not receive all expected events!");
        }
    }
}