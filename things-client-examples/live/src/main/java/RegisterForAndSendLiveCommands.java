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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.cr.integration.IntegrationClient;
import com.bosch.iot.things.commands.live.modify.CreateThingLiveCommandAnswerBuilder;
import com.bosch.iot.things.commands.live.modify.ModifyFeaturePropertyLiveCommandAnswerBuilder;

/**
 * This example shows how the {@link com.bosch.cr.integration.live.Live Live} client can be used to register for,
 * send, and respond to live commands.
 */
public class RegisterForAndSendLiveCommands extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForAndEmitLiveEvents.class);

    private final IntegrationClient backendClient;
    private final IntegrationClient clientAtDevice;

    private final String thingId = SOLUTION_DEFAULT_NAMESPACE + ":live1";

    public RegisterForAndSendLiveCommands() throws Exception {
        backendClient = client;
        clientAtDevice = client2;
    }

    public void registerForAndEmitLiveCommands() {

        LOGGER.info("[AT DEVICE] register handler for 'CreateThing' LIVE commands..");
        clientAtDevice.live()
                .handleCreateThingCommands(command -> {
                    LOGGER.info("[AT DEVICE] Received live command: {}", command.getType());
                    LOGGER.info("[AT DEVICE] Thing to create: {}", command.getThing());
                    LOGGER.info("[AT DEVICE] Answering ...");
                    return command.answer()
                            .withResponse(CreateThingLiveCommandAnswerBuilder.ResponseFactory::created)
                            .withEvent(CreateThingLiveCommandAnswerBuilder.EventFactory::created);
                });

        LOGGER.info("[AT DEVICE] register handler for 'ModifyFeatureProperty' LIVE commands..");
        clientAtDevice.live()
                .forId(thingId)
                .forFeature("temp-sensor")
                .handleModifyFeaturePropertyCommands(command -> {
                    LOGGER.info("[AT DEVICE] Received live command: {}", command.getType());
                    LOGGER.info("[AT DEVICE] Property to modify: '{}' to value: '{}'", command.getPropertyPointer(),
                            command.getPropertyValue());
                    LOGGER.info("[AT DEVICE] Answering ...");
                    return command.answer()
                            .withResponse(ModifyFeaturePropertyLiveCommandAnswerBuilder.ResponseFactory::modified)
                            .withEvent(ModifyFeaturePropertyLiveCommandAnswerBuilder.EventFactory::modified);
                });

        LOGGER.info("[AT BACKEND] create a new LIVE Thing..");
        backendClient.live()
                .create(thingId)
                .whenComplete(((thing, throwable) -> {
                    if (throwable != null) {
                        LOGGER.error("[AT BACKEND] Received error when creating the thing.", throwable);
                    } else if (thing.getId().get().equals(thingId)) {
                        LOGGER.info("[AT BACKEND] Successfully created live Thing and got response: {}", thing);
                    } else {
                        LOGGER.warn("[AT BACKEND] Received unexpected thing {}.", thing);
                    }
                }));

        LOGGER.info("[AT BACKEND] put 'temperature' property of 'temp-sensor' LIVE Feature..");
        backendClient.live()
                .forFeature(thingId, "temp-sensor")
                .putProperty("temperature", 23.21)
                .whenComplete(((_void, throwable) -> {
                    if (throwable != null) {
                        LOGGER.error("[AT BACKEND] Received error when putting the property: ",
                                throwable.getMessage(), throwable);
                    } else {
                        LOGGER.info("[AT BACKEND] Putting the property succeeded");
                    }
                }));
    }

}
