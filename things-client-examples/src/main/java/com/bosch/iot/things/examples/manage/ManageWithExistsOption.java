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

import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.model.things.Feature;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.clientapi.options.Option;
import com.bosch.iot.things.clientapi.options.Options;
import com.bosch.iot.things.clientapi.things.ThingHandle;
import com.bosch.iot.things.clientapi.twin.TwinFeatureHandle;
import com.bosch.iot.things.examples.common.ExamplesBase;

/**
 * <p>
 * This example shows how the exists-option (specified by the factory-method {@link
 * com.bosch.iot.things.clientapi.options.Options.Modify#exists(boolean)} can be used in the context of managing a
 * feature.
 * </p>
 * <p>
 * Note that this option can be also used top-level to manage a Thing ({@link com.bosch.iot.things.clientapi.things.CommonThingIntegration#put(Thing,
 * Option[])}) and on various other levels such as a certain attribute, e.g. by using {@link
 * ThingHandle#putAttribute(JsonPointer, int, Option[])}).
 * </p>
 */
public class ManageWithExistsOption extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(ManageWithExistsOption.class);

    private static final String FEATURE_ID = "myFeature";

    public void putFeatureWithExistsFalsePreventsOverwrites() throws InterruptedException, ExecutionException,
            TimeoutException {

        LOGGER.info("Shows how the exists-Option with value 'false' only allows creates, i.e. prevents overwrites.");

        trackFeatureChanges();

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder().setId(thingId).build();
        client.twin().create(thing).get(TIMEOUT_VALUE, SECONDS);


        final Feature feature = ThingsModelFactory.newFeature(FEATURE_ID,
                ThingsModelFactory.newFeatureProperties(JsonFactory.newObjectBuilder().set("foo", 1).build()));

        final ThingHandle<TwinFeatureHandle> thingHandle = client.twin().forId(thingId);

        // first create will succeed
        thingHandle.putFeature(feature, Options.Modify.exists(false))
                .get(TIMEOUT_VALUE, TIMEOUT_UNIT);
        LOGGER.info("Successfully created feature: featureId '{}'.", FEATURE_ID);

        // second create will fail
        thingHandle.putFeature(feature, Options.Modify.exists(false))
                .handle((unused, e) -> {
                    if (e != null) {
                        LOGGER.info("Got expected failure trying to create feature twice: featureId '{}'.",
                                FEATURE_ID, e);
                    } else {
                        LOGGER.error(
                                "Did not get expected failure when trying to create feature twice: featureId '{}'.",
                                FEATURE_ID);
                    }
                    return null;
                })
                .get(TIMEOUT_VALUE, TIMEOUT_UNIT);
    }

    public void putFeatureWithExistsTruePreventsCreates() throws InterruptedException, ExecutionException,
            TimeoutException {

        LOGGER.info("Shows how the exists-Option with value 'true' only allows updates, i.e. prevents creates.");

        trackFeatureChanges();

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder().setId(thingId).build();
        client.twin().create(thing).get(TIMEOUT_VALUE, SECONDS);


        final Feature feature = ThingsModelFactory.newFeature(FEATURE_ID,
                ThingsModelFactory.newFeatureProperties(JsonFactory.newObjectBuilder().set("foo", 1).build()));

        final ThingHandle<TwinFeatureHandle> thingHandle = client.twin().forId(thingId);

        // first update will fail, because the feature does not yet exist
        thingHandle.putFeature(feature, Options.Modify.exists(true))
                .handle((unused, e) -> {
                    if (e != null) {
                        LOGGER.info("Got expected failure trying to update non-existing feature: featureId '{}'.",
                                FEATURE_ID, e);
                    } else {
                        LOGGER.error(
                                "Did not get expected failure when trying to update non-existing feature: featureId '{}'.",
                                FEATURE_ID);
                    }
                    return null;
                })
                .get(TIMEOUT_VALUE, TIMEOUT_UNIT);

        // create the feature
        thingHandle.putFeature(feature)
                .get(TIMEOUT_VALUE, TIMEOUT_UNIT);
        LOGGER.info("Created feature: featureId '{}'.", FEATURE_ID);

        // second update will succeed, because the feature now exists
        thingHandle.putFeature(feature, Options.Modify.exists(true))
                .get(TIMEOUT_VALUE, TIMEOUT_UNIT);
        LOGGER.info("Successfully updated feature: featureId '{}'.", FEATURE_ID);
    }

    private void trackFeatureChanges() {
        client.twin().registerForFeatureChanges(UUID.randomUUID().toString(), featureChange -> {
            final String featureId = featureChange.getFeature().getId();
            final JsonPointer path = featureChange.getPath();
            final JsonValue value = featureChange.getValue().orElse(null);

            LOGGER.info("FeatureChange for featureId {} received on path {} - value was: {}", featureId, path, value);
        });
    }

    public static void main(final String... args) throws Exception {
        final ManageWithExistsOption manage = new ManageWithExistsOption();
        try {
            manage.putFeatureWithExistsFalsePreventsOverwrites();
            manage.putFeatureWithExistsTruePreventsCreates();
        } finally {
            manage.terminate();
        }
    }
}
