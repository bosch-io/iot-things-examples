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
package com.bosch.iot.things.examples.manage;

import static java.util.concurrent.TimeUnit.SECONDS;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.clientapi.twin.Twin;
import com.bosch.iot.things.clientapi.twin.TwinThingHandle;
import com.bosch.iot.things.examples.common.ExamplesBase;

/**
 * This example shows how a {@link com.bosch.iot.things.clientapi.things.ThingHandle}  can be used to perform
 * CRUD (Create, Read, Update, and Delete) operations on {@link org.eclipse.ditto.model.things.Attributes} of a thing.
 */
public class ManageAttributes extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(ManageAttributes.class);

    private static final JsonPointer ATTRIBUTE_JSON_POINTER1 = JsonFactory.newPointer("location");
    private static final JsonValue ATTRIBUTE_JSON_VALUE1 = JsonFactory.newValue(43.652);
    private static final JsonValue NEW_ATTRIBUTE_JSON_VALUE = JsonFactory.newValue(21.981);
    private static final JsonPointer ATTRIBUTE_JSON_POINTER2 = JsonFactory.newPointer("height");
    private static final JsonValue ATTRIBUTE_JSON_VALUE2 = JsonFactory.newValue(13398);

    private static final int TIMEOUT = 5;

    public void crudAttributes() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Starting: {}()", Thread.currentThread().getStackTrace()[1].getMethodName());

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setAttribute(ATTRIBUTE_JSON_POINTER1, ATTRIBUTE_JSON_VALUE1)
                .setAttribute(ATTRIBUTE_JSON_POINTER2, ATTRIBUTE_JSON_VALUE2)
                .build();

        final Twin twin = client.twin();
        twin.create(thing).get(TIMEOUT, SECONDS);
        final TwinThingHandle thingHandle = twin.forId(thingId);

        thingHandle.putAttribute(ATTRIBUTE_JSON_POINTER1, NEW_ATTRIBUTE_JSON_VALUE)
                .thenCompose(aVoid -> thingHandle.retrieve())
                .thenAccept(thing1 -> LOGGER.info("RETRIEVED thing is {}", thing1.toJsonString()))
                .thenCompose(aVoid1 -> thingHandle.deleteAttributes())
                .thenCompose(aVoid2 -> thingHandle.retrieve())
                .thenAccept(
                        thing2 -> LOGGER.info("RETRIEVED thing after attributes where deleted is {}",
                                thing2.toJsonString()))
                .get(5, TimeUnit.SECONDS);
    }

    public static void main(String[] args) throws Exception {
        final ManageAttributes manageAttributes = new ManageAttributes();
        try {
            manageAttributes.crudAttributes();
            manageAttributes.terminate();
        } finally {
            manageAttributes.terminate();
        }
    }
}