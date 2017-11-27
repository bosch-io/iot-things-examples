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

import java.nio.ByteBuffer;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.model.base.auth.AuthorizationContext;
import org.eclipse.ditto.model.base.auth.AuthorizationModelFactory;
import org.eclipse.ditto.model.base.auth.AuthorizationSubject;
import org.eclipse.ditto.model.base.common.HttpStatusCode;
import org.eclipse.ditto.model.things.AccessControlListModelFactory;
import org.eclipse.ditto.model.things.AclEntry;
import org.eclipse.ditto.model.things.Thing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.clientapi.live.LiveThingHandle;
import com.bosch.iot.things.clientapi.messages.RepliableMessage;

/**
 * This example shows how to register for- and reply to claim messages with the Things Client.
 *
 * @since 3.1.0
 */
public final class RegisterForClaimMessages extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForClaimMessages.class);

    private final String registrationIdAllClaimMessages;
    private final String registrationIdClaimMessagesForThing;

    private RegisterForClaimMessages() {
        registrationIdAllClaimMessages = UUID.randomUUID().toString();
        registrationIdClaimMessagesForThing = UUID.randomUUID().toString();
    }

    public static RegisterForClaimMessages newInstance() {
        return new RegisterForClaimMessages();
    }

    /**
     * Registers for claim messages sent to all things.
     * To claim the prepared Thing, you can use our swagger documentation provided at
     * https://things.apps.bosch-iot-cloud.com/ or any other REST client.
     */
    public void registerForClaimMessagesToAllThings() {
        prepareClaimableThing()
                .thenAccept(thingHandle -> {
                    client.live().registerForClaimMessage(registrationIdAllClaimMessages, this::handleMessage);
                    LOGGER.info("Thing '{}' ready to be claimed", thingHandle.getThingId());
                });
    }

    /**
     * Registers for claim messages sent to a single Thing.
     * To claim the prepared Thing, you can use our swagger documentation provided at
     * https://things.apps.bosch-iot-cloud.com/ or any other REST client.
     */
    public void registerForClaimMessagesToSingleThing()
            throws InterruptedException, ExecutionException, TimeoutException {
        client.live().startConsumption().get(10, TimeUnit.SECONDS);
        prepareClaimableThing()
                .thenAccept(thingHandle -> {
                    thingHandle.registerForClaimMessage(registrationIdClaimMessagesForThing, this::handleMessage);
                    LOGGER.info("Thing '{}' ready to be claimed!", thingHandle.getThingId());
                });
    }

    private CompletableFuture<LiveThingHandle> prepareClaimableThing() {
        final String thingId = generateRandomThingId();
        return client.twin().create(thingId)
                .thenCompose(created -> {
                    final Thing updated =
                            created.toBuilder().setPermissions(AuthorizationModelFactory.newAuthSubject(CLIENT_ID),
                                    AccessControlListModelFactory.allPermissions()).build();
                    return client.twin().update(updated);
                })
                .thenApply(created -> client.live().forId(thingId));
    }

    private void handleMessage(final RepliableMessage<ByteBuffer, Object> message) {
        final AuthorizationContext authorizationContext = message.getAuthorizationContext();
        final Optional<AuthorizationSubject> firstAuthorizationSubject =
                authorizationContext.getFirstAuthorizationSubject();
        if (firstAuthorizationSubject.isPresent()) {
            final AuthorizationSubject authorizationSubject = firstAuthorizationSubject.get();
            final String thingId = message.getThingId();
            final AclEntry aclEntry = AccessControlListModelFactory
                    .newAclEntry(authorizationSubject, AccessControlListModelFactory.allPermissions());

            client.twin().forId(thingId)
                    .retrieve()
                    .thenCompose(thing -> client.twin().update(thing.setAclEntry(aclEntry)))
                    .whenComplete((aVoid, throwable) -> {
                        if (null != throwable) {
                            message.reply()
                                    .statusCode(HttpStatusCode.BAD_GATEWAY)
                                    .timestamp(OffsetDateTime.now())
                                    .payload("Error: Claiming failed. Please try again later.")
                                    .contentType("text/plain")
                                    .send();
                            LOGGER.info("Update failed: '{}'", throwable.getMessage());
                        } else {
                            message.reply()
                                    .statusCode(HttpStatusCode.OK)
                                    .timestamp(OffsetDateTime.now())
                                    .payload(JsonFactory.newObjectBuilder().set("success", true).build())
                                    .contentType("application/json")
                                    .send();
                            LOGGER.info("Thing '{}' claimed from authorization subject '{}'", thingId,
                                    authorizationSubject);
                        }
                    });
        } else {
            message.reply()
                    .statusCode(HttpStatusCode.BAD_REQUEST)
                    .timestamp(OffsetDateTime.now())
                    .payload("Error: no authorization context present.")
                    .contentType("text/plain")
                    .send();
        }
    }
}
