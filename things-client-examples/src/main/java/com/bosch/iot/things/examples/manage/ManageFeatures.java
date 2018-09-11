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

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.model.things.FeatureProperties;
import org.eclipse.ditto.model.things.Features;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.clientapi.things.FeatureHandle;
import com.bosch.iot.things.clientapi.things.ThingHandle;
import com.bosch.iot.things.clientapi.twin.Twin;
import com.bosch.iot.things.clientapi.twin.TwinFeatureHandle;
import com.bosch.iot.things.clientapi.twin.TwinThingHandle;
import com.bosch.iot.things.examples.common.ExamplesBase;

/**
 * This example shows how a {@link ThingHandle} and {@link FeatureHandle} can be used to perform CRUD (Create, Read,
 * Update, and Delete) operations on {@link Features} and {@link FeatureProperties}.
 */
public class ManageFeatures extends ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(ManageFeatures.class);

    private static final int TIMEOUT = 5;

    private static final String FEATURE_ID = "smokeDetector";
    private static final String FEATURE_ID2 = "elevator";
    private static final JsonPointer PROPERTY_JSON_POINTER = JsonFactory.newPointer("density");
    private static final JsonValue PROPERTY_JSON_VALUE = JsonFactory.newValue(0.7);

    public void crudFeature() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Create, read, update and delete a Feature of a Thing.");

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setFeature(ThingsModelFactory.newFeature("foo",
                        ThingsModelFactory.newFeatureProperties(JsonFactory.newObjectBuilder().set("foo", 1).build())))
                .build();

        client.twin().registerForFeatureChanges(UUID.randomUUID().toString(), featureChange -> {
            final String featureId = featureChange.getFeature().getId();
            final JsonPointer path = featureChange.getPath();
            final Optional<JsonValue> value = featureChange.getValue()
                    .map(JsonValue::asObject) // "feature" is a JsonObject
                    .flatMap(jsonObj -> path.isEmpty() ? featureChange.getValue() : jsonObj.getValue(path));
            LOGGER.info("FeatureChange for featureId {} received on path {} - value was: {}", featureId, path, value);
        });

        client.twin().create(thing).get(TIMEOUT, SECONDS);

        final ThingHandle<TwinFeatureHandle> thingHandle = client.twin().forId(thingId);

        thingHandle.registerForFeatureChanges(UUID.randomUUID().toString(),
                featureChange -> LOGGER.info("{} Feature '{}'", featureChange.getAction(), featureChange.getFeature()));

        thingHandle.putFeature(ThingsModelFactory.newFeature(FEATURE_ID))
                .thenCompose(aVoid -> thingHandle.forFeature(FEATURE_ID).retrieve())
                .thenCompose(feature -> {
                    LOGGER.info("RETRIEVED Feature '{}'", feature);
                    return thingHandle.putFeature(ThingsModelFactory.newFeature(FEATURE_ID)
                            .setProperty(PROPERTY_JSON_POINTER, PROPERTY_JSON_VALUE));
                }).thenCompose(aVoid -> thingHandle.forFeature(FEATURE_ID).delete())
                .get(TIMEOUT, SECONDS);
    }

    public void crudFeatureProperty() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Create, read, update and delete a property of a Feature.");

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setFeature(ThingsModelFactory.newFeature(FEATURE_ID))
                .build();

        client.twin().create(thing).get(TIMEOUT, SECONDS);

        final FeatureHandle featureHandle = client.twin().forFeature(thingId, FEATURE_ID);

        client.twin().registerForFeaturePropertyChanges(UUID.randomUUID().toString(), FEATURE_ID,
                featurePropertyChange -> LOGGER
                        .info("Things Client handler: {} Property '{}:{}'", featurePropertyChange.getAction(),
                                featurePropertyChange.getPath(), featurePropertyChange.getValue()));

        client.twin()
                .registerForFeaturePropertyChanges(UUID.randomUUID().toString(), FEATURE_ID, PROPERTY_JSON_POINTER,
                        featurePropertyChange -> LOGGER
                                .info("Things Client handler for property {}: {} Property '{}:{}'",
                                        PROPERTY_JSON_POINTER,
                                        featurePropertyChange.getAction(), featurePropertyChange.getPath(),
                                        featurePropertyChange.getValue()));

        featureHandle.registerForPropertyChanges(UUID.randomUUID().toString(), PROPERTY_JSON_POINTER,
                featurePropertyChange -> LOGGER.info("Feature handler: {} Property '{}:{}'",
                        featurePropertyChange.getAction(),
                        featurePropertyChange.getPath(), featurePropertyChange.getValue()));

        featureHandle.putProperty(PROPERTY_JSON_POINTER, PROPERTY_JSON_VALUE)
                .thenCompose(aVoid -> featureHandle.retrieve())
                .thenCompose(feature -> {
                    LOGGER.info("RETRIEVED Property '{}'", feature.getProperty(PROPERTY_JSON_POINTER));
                    return featureHandle.putProperty(PROPERTY_JSON_POINTER, 0.9);
                })
                .thenCompose(aVoid -> featureHandle.deleteProperty(PROPERTY_JSON_POINTER))
                .get(TIMEOUT, SECONDS);
    }

    public void crudFeatureProperties() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Create, read, update and delete all properties of a Feature.");

        final String thingId = generateRandomThingId();
        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setFeature(ThingsModelFactory.newFeature(FEATURE_ID))
                .build();

        client.twin().create(thing).get(TIMEOUT, SECONDS);

        final FeatureHandle featureHandle = client.twin().forFeature(thingId, FEATURE_ID);

        featureHandle.registerForPropertyChanges(UUID.randomUUID().toString(), featurePropertyChange -> LOGGER
                .info("{} Properties '{}:{}'", featurePropertyChange.getAction(), featurePropertyChange.getPath(),
                        featurePropertyChange.getValue()));

        featureHandle.setProperties(ThingsModelFactory.newFeaturePropertiesBuilder()
                .set(PROPERTY_JSON_POINTER, PROPERTY_JSON_VALUE)
                .build())
                .thenCompose(aVoid -> featureHandle.retrieve())
                .thenCompose(feature -> {
                    LOGGER.info("RETRIEVED Properties '{}'", feature.getProperties());
                    return featureHandle.setProperties(ThingsModelFactory.newFeaturePropertiesBuilder()
                            .set(PROPERTY_JSON_POINTER, 0.9)
                            .build());
                }).thenCompose(aVoid -> featureHandle.deleteProperties())
                .get(TIMEOUT, SECONDS);
    }

    public void deleteFeatures() throws InterruptedException, ExecutionException, TimeoutException {
        LOGGER.info("Deleting all features of a Thing.");

        final String thingId = generateRandomThingId();

        final Thing thing = ThingsModelFactory.newThingBuilder()
                .setId(thingId)
                .setFeature(ThingsModelFactory.newFeature(FEATURE_ID))
                .setFeature(ThingsModelFactory.newFeature(FEATURE_ID2))
                .build();

        final Twin twin = client.twin();

        twin.create(thing).get(TIMEOUT, SECONDS);

        final TwinThingHandle thingHandle = twin.forId(thingId);

        thingHandle.registerForFeaturesChanges(UUID.randomUUID().toString(),
                featuresChange -> LOGGER.info("{} Features '{}:{}'", featuresChange.getAction(),
                        featuresChange.getPath(), featuresChange.getValue()));

        thingHandle.deleteFeatures().thenCompose(aVoid -> thingHandle.retrieve())
                .thenAccept(thing1 -> LOGGER.info("Features have been deleted: {}", thing1.toJsonString()))
                .get(TIMEOUT, SECONDS);
    }

    public static void main(final String... args) throws Exception {
        final ManageFeatures manageFeatures = new ManageFeatures();
        try {
            manageFeatures.crudFeature();
            manageFeatures.crudFeatureProperty();
            manageFeatures.crudFeatureProperties();
            manageFeatures.deleteFeatures();
        } finally {
            manageFeatures.terminate();
        }
    }
}
