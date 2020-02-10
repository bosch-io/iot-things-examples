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
package com.bosch.iot.things.examples.changes;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.client.changes.ChangeAction;
import org.eclipse.ditto.client.management.ThingHandle;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.examples.common.ExamplesBase;

/**
 * This example shows the various possibilities that the {@code DittoClient} offers for registering handlers to be
 * informed about {@link org.eclipse.ditto.client.changes.Change}s of your {@code Thing}s. NOTE: Make sure to invoke {@code
 * DittoClient.twin().startConsumption()} once after all handlers are registered to start receiving events.
 */
public final class RegisterForChanges extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForChanges.class);

    private static final String ALL_THINGS = "allThings";
    private static final String MY_THING = "myThing";

    private final CountDownLatch countDownLatch;
    private final String registrationId = UUID.randomUUID().toString();
    private final String thingId = generateRandomThingId();

    RegisterForChanges() {
        this.countDownLatch = new CountDownLatch(2);
    }

    public static void main(final String... args) throws Exception {
        final RegisterForChanges registerForChanges = new RegisterForChanges();
        try {
            registerForChanges.registerForThingChanges();
            registerForChanges.registerForThingChangesWithDeregistration();

            registerForChanges.createThing();
        } finally {
            registerForChanges.destroy();
        }
    }

    /**
     * Register for {@code ThingChange}s.
     */
    public void registerForThingChanges() {
        /* Register for change events of *all* things */
        client.twin().registerForThingChanges(ALL_THINGS, change -> {
            LOGGER.info("For all things: ThingChange received: {}", change);
            countDownLatch.countDown();
        });

        /* Register for *all* change events of a *specific* thing */
        client.twin()
                .registerForThingChanges(MY_THING, change -> LOGGER.info("My Thing: ThingChange received: {}", change));
    }

    /**
     * Register for {@code ThingChange}s and deregister after the created-event has been retrieved.
     */
    public void registerForThingChangesWithDeregistration() {
        final ThingHandle thingHandle = client.twin().forId(ThingId.of(thingId));

        /* Register for *all* change events of a *specific* thing */
        LOGGER.info("RegistrationId: {}", registrationId);
        thingHandle.registerForThingChanges(registrationId, change -> {
            LOGGER.info("{}: ThingChange received: {}", thingId, change);
            /* Deregister when the created-event has been retrieved */
            if (change.getAction() == ChangeAction.CREATED) {
                LOGGER.info("{}: Deregister handler with id: {}", thingId, registrationId);
                thingHandle.deregister(registrationId);
                countDownLatch.countDown();
            }
        });
    }

    public void createThing() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Create thing {}.", thingId);
        final Thing thing = Thing.newBuilder()
                .setId(ThingId.of(thingId))
                .build();
        client2.twin().create(thing)
                .thenCompose(createdThing -> {
                    final Thing updatedThing = createdThing.toBuilder()
                            .setAttribute(JsonPointer.of("foo"), JsonValue.of("bar"))
                            .build();
                    return client2.twin().update(updatedThing);
                }).get(10, TimeUnit.SECONDS);
    }

    public void destroy() throws InterruptedException {
        boolean allMessagesReceived = countDownLatch.await(10, TimeUnit.SECONDS);
        LOGGER.info("All changes received: {}", allMessagesReceived);
        terminate();
    }
}