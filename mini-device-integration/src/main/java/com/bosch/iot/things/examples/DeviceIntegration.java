/*
 * Bosch SI Example Code License Version 1.0, January 2016
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
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE
 * QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL
 * NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH BOSCH
 * SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT LIMITATION FOR
 * INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF THE GERMAN
 * PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN UNAFFECTED
 * BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF LIABILITY
 * ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S EMPLOYEES,
 * REPRESENTATIVES AND ORGANS.
 */
package com.bosch.iot.things.examples;

import static java.util.Optional.of;
import static org.eclipse.ditto.model.base.auth.AuthorizationModelFactory.newAuthSubject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.eclipse.ditto.json.JsonObject;
import org.eclipse.ditto.model.base.auth.AuthorizationSubject;
import org.eclipse.ditto.model.things.AclEntry;
import org.eclipse.ditto.model.things.Feature;
import org.eclipse.ditto.model.things.Permission;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.client.ThingsClientFactory;
import com.bosch.iot.things.client.configuration.CommonConfiguration;
import com.bosch.iot.things.client.configuration.CredentialsAuthenticationConfiguration;
import com.bosch.iot.things.client.configuration.ProxyConfiguration;
import com.bosch.iot.things.client.configuration.PublicKeyAuthenticationConfiguration;
import com.bosch.iot.things.client.messaging.MessagingProviders;
import com.bosch.iot.things.client.messaging.ThingsWsMessagingProviderConfiguration;
import com.bosch.iot.things.clientapi.ThingsClient;
import com.bosch.iot.things.clientapi.things.FeatureHandle;
import com.bosch.iot.things.clientapi.twin.Twin;

/**
 * This example shows how to create and use the Things Client for managing your first Thing.
 */
public class DeviceIntegration {

    private static final Logger LOGGER = LoggerFactory.getLogger(DeviceIntegration.class);
    private static final String CONFIG_PROPERTIES_FILE = "config.properties";
    private static final String COUNTER = "counter";
    private static final String COUNTER_VALUE = "value";

    private final String endpoint_ws;
    private final String solutionId;
    private final String apiToken;
    private final String namespace;

    private final String clientId;

    private final String userid;
    private final String username;
    private final String password;
    private final String tenantName;

    private final String proxyHost;
    private final String proxyPort;
    private final String proxyPrincipal;
    private final String proxyPassword;

    private URL keystoreLocation;
    private String keystoreAlias;
    private String keystorePassword;
    private String keystoreAliasPassword;

    private static final int TIMEOUT = 5;
    private final String thingId;
    private final ThingsClient thingsClient;
    private final Twin twin;

    /**
     * Client instantiation
     */
    public DeviceIntegration() {

        final Properties props = loadConfigurationFromFile();

        endpoint_ws = props.getProperty("endpoint_ws");
        solutionId = props.getProperty("solutionId");
        apiToken = props.getProperty("apiToken");
        namespace = props.getProperty("namespace");

        clientId = solutionId + ":connector";

        final String keystoreLocationProperty = props.getProperty("keystoreLocation");
        try {
            this.keystoreLocation = new File(keystoreLocationProperty).toURI().toURL();
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "The provided keystoreLocation '" + keystoreLocationProperty + "' is not valid: " +
                            e.getMessage());
        }
        keystorePassword = props.getProperty("keystorePassword");
        keystoreAlias = props.getProperty("keystoreAlias");
        keystoreAliasPassword = props.getProperty("keystoreAliasPassword");

        userid = props.getProperty("userid");
        username = props.getProperty("username");
        password = props.getProperty("password");
        tenantName = props.getProperty("tenantName");

        proxyHost = props.getProperty("proxyHost");
        proxyPort = props.getProperty("proxyPort");
        proxyPrincipal = props.getProperty("proxyPrincipal");
        proxyPassword = props.getProperty("proxyPassword");

        LOGGER.info("Creating Things Client ...");
        // Create a new Things Client instance to start interacting with Bosch IoT Things service
        thingsClient = initializeThingsClient();

        thingId = namespace + ":" + UUID.randomUUID().toString();

        // Create a new twin client for managing things
        twin = thingsClient.twin();
    }

    private ThingsClient initializeThingsClient() {
        // Build a credential authentication configuration if you want to directly connect to the IoT Things service
        // via its websocket channel
        final CredentialsAuthenticationConfiguration credentialsAuthenticationConfiguration =
                CredentialsAuthenticationConfiguration
                        .newBuilder()
                        .username(tenantName + "\\" + username)
                        .password(password)
                        .build();

        // or alternatively, build a key-based authentication configuration for communicating with IoT Things service
        final PublicKeyAuthenticationConfiguration publicKeyAuthenticationConfiguration =
                PublicKeyAuthenticationConfiguration
                        .newBuilder()
                        .clientId(clientId)
                        .keyStoreLocation(keystoreLocation)
                        .keyStorePassword(keystorePassword)
                        .alias(keystoreAlias)
                        .aliasPassword(keystoreAliasPassword)
                        .build();

        final ThingsWsMessagingProviderConfiguration thingsWsMessagingProviderConfiguration = MessagingProviders
                .thingsWebsocketProviderBuilder()
                .authenticationConfiguration(credentialsAuthenticationConfiguration /* or publicKeyAuthenticationConfiguration */)
                .endpoint(endpoint_ws)
                .build();


        final CommonConfiguration.OptionalConfigurationStep twinConfiguration =
                ThingsClientFactory.configurationBuilder()
                        .apiToken(apiToken)
                        .providerConfiguration(thingsWsMessagingProviderConfiguration);
        proxyConfiguration().ifPresent(twinConfiguration::proxyConfiguration);
        return ThingsClientFactory.newInstance(twinConfiguration.build());
    }

    public static void main(final String... args) {
        new DeviceIntegration().execute();
    }

    /**
     * Create and update a thing with the java client.
     */
    private void execute() {
        try {
            // Create a Thing with a counter Feature and get the FeatureHandle
            final FeatureHandle counter = createThingWithCounter();

            // Update the ACL with your User ID to see your thing in the Demo Web UI
            // Uncomment this if you use Things-client 3.2 or below which use API1
//            updateACL();
            // Log full Thing info (as JSON)
            LOGGER.info("Thing looks like this: {}", getThingById(thingId).toJson());

            // Loop to update the attributes of the Thing
            for (int i = 0; i <= 100; i++) {
                updateCounter(counter, i);
                Thread.sleep(2000);
            }

            // This step must always be concluded to terminate the Java client.
            terminate();
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            LOGGER.error(e.getMessage());
        }
    }

    /**
     * Create a {@code Thing} with the counter {@code Feature}. Blocks until Thing has been created.
     *
     * @return a handle for the counter.
     */
    public FeatureHandle createThingWithCounter() {
        final Thing thing = Thing.newBuilder() //
                .setId(thingId) //
                .setFeature(Feature.newBuilder() //
                        .properties(JsonObject.newBuilder() //
                                .set(COUNTER_VALUE, 0) //
                                .build()) //
                        .withId(COUNTER) //
                        .build()) //
                .build();

        FeatureHandle featureHandle = null;

        try {
            featureHandle = twin.create(thing) //
                    .thenApply(created -> twin.forFeature(thingId, COUNTER)) //
                    .get(TIMEOUT, TimeUnit.SECONDS);

            LOGGER.info("Thing with ID '{}' created.", thingId);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            LOGGER.error(e.getMessage());
        }

        return featureHandle;
    }

    /**
     * Find a Thing with given ThingId. Blocks until the Thing has been retrieved.
     */
    public Thing getThingById(final String thingId) throws InterruptedException, ExecutionException, TimeoutException {
        return twin.forId(thingId).retrieve().get(TIMEOUT, TimeUnit.SECONDS);
    }

    /**
     * Delete a Thing.
     */
    public void deleteThing(final String thingId) throws InterruptedException, ExecutionException, TimeoutException {
        twin.delete(thingId)
                .whenComplete((aVoid, throwable) -> {
                    if (null == throwable) {
                        LOGGER.info("Thing with ID deleted: {}", thingId);
                    } else {
                        LOGGER.error(throwable.getMessage());
                    }
                })
                .get(TIMEOUT, TimeUnit.SECONDS);
    }

    /**
     * Update the ACL of a specified Thing. Blocks until ACL has been updated.
     */
    public void updateACL() throws InterruptedException, ExecutionException, TimeoutException {
        twin.forId(thingId) //
                .retrieve() //
                .thenCompose(thing -> {
                    final AclEntry aclEntry = AclEntry.newInstance(AuthorizationSubject.newInstance(userid), //
                            Permission.READ, //
                            Permission.WRITE, //
                            Permission.ADMINISTRATE);

                    final Thing updated = thing.setAclEntry(aclEntry);
                    return twin.update(updated);
                }) //
                .whenComplete((aVoid, throwable) -> {
                    if (null == throwable) {
                        LOGGER.info("Thing with ID '{}' updated ACL entry!", thingId);
                    } else {
                        LOGGER.error(throwable.getMessage());
                    }
                }).get(TIMEOUT, TimeUnit.SECONDS);
    }

    /**
     * Update {@code counter} with {@code value}. Method does not block but returns as soon as the update has been
     * triggered.
     */
    public void updateCounter(final FeatureHandle counter, final int value) {
        counter.putProperty(COUNTER_VALUE, value) //
                .whenComplete((aVoid, throwable) -> {
                    if (null == throwable) {
                        LOGGER.info("Thing with ID '{}' updated with Counter={}!", counter.getThingId(), value);
                    } else {
                        LOGGER.error(throwable.getMessage());
                    }
                });
    }

    /**
     * Destroys the client and waits for its graceful shutdown.
     */
    public void terminate() {
        // Gracefully shutdown the thingsClient
        thingsClient.destroy();
    }

    private Properties loadConfigurationFromFile() {
        final Properties props = new Properties(System.getProperties());
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(CONFIG_PROPERTIES_FILE)) {
            props.load(in);
        } catch (IOException ioe) {
            throw new IllegalStateException(
                    "File " + CONFIG_PROPERTIES_FILE + " could not be opened but is required for this example: "
                            + ioe.getMessage());
        }
        return props;
    }

    private Optional<ProxyConfiguration> proxyConfiguration() {

        if (proxyHost != null && proxyPort != null) {
            final ProxyConfiguration.ProxyOptionalSettable builder = ProxyConfiguration.newBuilder()
                    .proxyHost(proxyHost)
                    .proxyPort(Integer.parseInt(proxyPort));
            if (proxyPrincipal != null && proxyPassword != null) {
                builder.proxyUsername(proxyPrincipal).proxyPassword(proxyPassword);
            }
            return of(builder.build());
        }
        return Optional.empty();
    }


}
