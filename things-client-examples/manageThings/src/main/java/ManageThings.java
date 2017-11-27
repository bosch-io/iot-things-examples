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

import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonFieldSelector;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.model.base.auth.AuthorizationModelFactory;
import org.eclipse.ditto.model.base.json.JsonSchemaVersion;
import org.eclipse.ditto.model.things.Feature;
import org.eclipse.ditto.model.things.Permission;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This example shows how a {@code Twin} or {@code ThingHandle} can be used to perform CRUD (Create, Read, Update, and
 * Delete) operations on {@code Thing}(s).
 */
public class ManageThings extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(ManageThings.class);
    private final String complexThingId;

    ManageThings() {
        super();
        complexThingId = generateRandomThingId("complexThing_");
    }

    /**
     * Creates a new {@code Thing} object, updates the thing by adding a new attribute to the thing, retrieves the
     * modified thing, and finally deletes it.
     *
     * @throws ExecutionException if a failure response is received for any of the requests, or if an exception occurs
     * inside the provided result handlers. This root cause can be retrieved using {@link
     * ExecutionException#getCause()}.
     * @throws TimeoutException if not all operations are terminated with a result (success or failure) within the given
     * timeout.
     * @throws InterruptedException if the executing thread is interrupted while waiting for a response.
     */
    public void createReadUpdateDelete() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Starting: createReadUpdateDelete()");
        client.twin().create(myThingId)
                .thenCompose(createdThing -> myThing.putAttribute(JsonFactory.newPointer("address/city"), "Berlin"))
                .thenCompose(changedSuccessfully -> myThing.retrieve())
                .thenCompose(retrievedThing -> {
                    LOGGER.info("My thing as persisted: {}", retrievedThing);
                    return myThing.delete();
                }).get(10, TimeUnit.SECONDS);
    }

    /**
     * Creates a complex {@code Thing} object with {@code ACL}s, {@code Feature}s, and {@code Attribute}s, and waits for
     * a success or failure result.
     *
     * @throws ExecutionException if a failure response is received for the requests, or if an exception occurs inside
     * the provided result handler. This root cause can be retrieved using {@link ExecutionException#getCause()}.
     * @throws TimeoutException if the operation is not terminated with a result (success or failure) within the given
     * timeout.
     * @throws InterruptedException if the executing thread is interrupted while waiting for a response.
     */
    public void createAComplexThing() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Starting: createAComplexThing()");
        /* Create a new thing with acls, features, attributes and define handlers for success and failure */
        client.twin().create(complexThingId).thenCompose(created -> {
            final Thing updated =
                    created.toBuilder()
                            .setPermissions(AuthorizationModelFactory.newAuthSubject(CLIENT_ID),
                                    ThingsModelFactory.allPermissions())
                            .setPermissions(AuthorizationModelFactory.newAuthSubject("anotherUserId"), Permission.READ)
                            .setFeatureProperty("featureId", JsonFactory.newPointer("propertyName"),
                                    JsonFactory.newValue("value"))
                            .setAttribute(JsonFactory.newPointer("attributeName"), JsonFactory.newValue("value"))
                            .build();
            return client.twin().update(updated);
        }).whenComplete((thing, throwable) -> {
            if (throwable == null) {
                LOGGER.info("Thing created: {}", complexThingId);
            } else {
                LOGGER.error("Create Thing Failed: {}", throwable);
            }
        }).get(1, TimeUnit.SECONDS);
    }

    /**
     * Shows different possibilities to retrieve a {@code Thing} or list of {@code Thing}s using their ids, with or
     * without {@code FieldSelector}s. {@code FieldSelector}s allow you to gain performance and save bandwidth by only
     * retrieving those fields of a that you are interested in.
     *
     * @throws ExecutionException if a failure response is received for the requests, or if an exception occurs inside
     * the provided result handler. This root cause can be retrieved using {@link ExecutionException#getCause()}.
     * @throws TimeoutException if the operation is not terminated with a result (success or failure) within the given
     * timeout.
     * @throws InterruptedException if the executing thread is interrupted while waiting for a response.
     */
    public void retrieveThings() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Starting: retrieveThings()");
        /* Retrieve a Single Thing*/
        client.twin().forId(complexThingId).retrieve().thenAccept(thing -> LOGGER.info("Retrieved thing: {}", thing))
                .get(1, TimeUnit.SECONDS);

        /* Retrieve a List of Things */
        client.twin().retrieve(myThingId, complexThingId).thenAccept(things -> {
            if (things.isEmpty()) {
                LOGGER.info(
                        "The requested things were not found, or you don't have sufficient permission to read them.");
            } else {
                LOGGER.info("Retrieved things: {}", Arrays.toString(things.toArray()));
            }
        }).get(1, TimeUnit.SECONDS);

        /* Retrieve a List of Things with field selectors */
        client.twin().retrieve(JsonFieldSelector.newInstance("attributes"), myThingId, complexThingId)
                .thenAccept(things -> {
                    if (things.isEmpty()) {
                        LOGGER.info(
                                "The requested things were not found, or you don't have sufficient permission to read them.");
                    } else {
                        things.forEach(
                                thing -> LOGGER.info("Thing {} has attributes {}.", thing, thing.getAttributes()));
                    }
                }).get(1, TimeUnit.SECONDS);
    }

    public void updateThing() throws InterruptedException, TimeoutException, ExecutionException {
        LOGGER.info("Starting: updateThing()");
        final CountDownLatch countDownLatch = new CountDownLatch(2);
        final String thingId = "com.bosch.iot.example:" + UUID.randomUUID().toString();
        final JsonPointer attributeJsonPointer = JsonFactory.newPointer("foo");
        final JsonValue attributeJsonValue = JsonFactory.newValue("bar");
        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setAttribute(attributeJsonPointer, attributeJsonValue)
                .build();

        LOGGER.info("Registering for changes of thing {}", thingId);
        client.twin().forId(thingId).registerForThingChanges(UUID.randomUUID().toString(), change -> {
            LOGGER.info("Received Event: {} -> {}", change.getAction(), change.getValue());
            countDownLatch.countDown();
        });

        LOGGER.info("Creating thing {}", thing);
        client2.twin().create(thing)
                .thenCompose(created -> {
                    LOGGER.info("Thing created: {}", created.toJsonString(JsonSchemaVersion.V_1));

                    final Feature feature = ThingsModelFactory.newFeature("myFeature");
                    final Thing updated = created.toBuilder()
                            .removeAllAttributes()
                            .setFeature(feature)
                            .build();

                    LOGGER.info("Updating thing {}", updated);
                    return client2.twin().update(updated);
                }).whenComplete((aVoid, throwable) -> {
            if (null != throwable) {
                LOGGER.info("Update failed: '{}'", throwable.getMessage());
            } else {
                LOGGER.info("Update successful!");
            }
        }).get(2, TimeUnit.SECONDS);

        boolean allMessagesReceived = countDownLatch.await(10, TimeUnit.SECONDS);
        LOGGER.info("All events received: {}", allMessagesReceived);
    }
}