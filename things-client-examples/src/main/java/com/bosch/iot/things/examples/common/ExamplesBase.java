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
package com.bosch.iot.things.examples.common;

import static java.util.Optional.of;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;

import org.eclipse.ditto.client.DittoClient;
import org.eclipse.ditto.client.DittoClients;
import org.eclipse.ditto.client.configuration.ClientCredentialsAuthenticationConfiguration;
import org.eclipse.ditto.client.configuration.MessagingConfiguration;
import org.eclipse.ditto.client.configuration.ProxyConfiguration;
import org.eclipse.ditto.client.configuration.WebSocketMessagingConfiguration;
import org.eclipse.ditto.client.live.internal.MessageSerializerFactory;
import org.eclipse.ditto.client.live.messages.MessageSerializerRegistry;
import org.eclipse.ditto.client.live.messages.MessageSerializers;
import org.eclipse.ditto.client.management.ThingHandle;
import org.eclipse.ditto.client.messaging.AuthenticationProviders;
import org.eclipse.ditto.client.messaging.MessagingProvider;
import org.eclipse.ditto.client.messaging.MessagingProviders;
import org.eclipse.ditto.client.twin.Twin;
import org.eclipse.ditto.model.base.json.JsonSchemaVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.examples.common.model.ExampleUser;

/**
 * Instantiates an {@link DittoClient} and connects to the Bosch IoT Things service. It also initializes {@link Twin}
 * and {@link ThingHandle} instances for reuse in tests that extend this base class.
 */
public abstract class ExamplesBase {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExamplesBase.class);
    private static final String CONFIG_PROPERTIES_FILE = "config.properties";

    protected final String namespace;

    protected final String endpointWs;

    protected final String clientId;
    protected final String anotherClientId;
    protected final String clientSecret;
    protected final String anotherClientSecret;
    protected final String tokenEndpoint;

    protected final String proxyHost;
    protected final String proxyPort;
    protected final String proxyPrincipal;
    protected final String proxyPassword;
    protected final DittoClient client;
    protected final DittoClient client2;
    protected final Twin twin;
    protected final String myThingId;

    /**
     * Constructor.
     */
    protected ExamplesBase() {

        //Read config.properties
        final Properties props = loadConfigurationFromFile();

        namespace = props.getProperty("namespace");

        endpointWs = props.getProperty("endpointWs");

        clientId = props.getProperty("clientId");
        anotherClientId = props.getProperty("anotherClientId");
        tokenEndpoint = props.getProperty("tokenEndpoint");
        clientSecret = props.getProperty("clientSecret");
        anotherClientSecret = props.getProperty("anotherClientSecret");

        proxyHost = props.getProperty("proxyHost");
        proxyPort = props.getProperty("proxyPort");
        proxyPrincipal = props.getProperty("proxyPrincipal");
        proxyPassword = props.getProperty("proxyPassword");

        LOGGER.info("Creating Ditto Client ...");

        // Create a new DittoClient object to start interacting with IoT Things service
        client = DittoClients.newInstance(createTwinConfiguration(clientId, clientSecret, tokenEndpoint, endpointWs),
                createTwinConfiguration(clientId, clientSecret, tokenEndpoint, endpointWs),
                setupCustomMessageSerializer());
        client2 = DittoClients.newInstance(createTwinConfiguration(clientId, clientSecret, tokenEndpoint, endpointWs),
                createTwinConfiguration(clientId, clientSecret, tokenEndpoint, endpointWs),
                setupCustomMessageSerializer());

        // Create a new twin client for managing things
        twin = client.twin();

        try {
            // and start consuming events
            twin.startConsumption().get(10, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            throw new IllegalStateException("Error creating Ditto Client.", e);
        }

        this.myThingId = namespace + ":myThing_" + UUID.randomUUID().toString();
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

    private MessagingProvider createTwinConfiguration(final String clientId, final String clientSecret,
            final String tokenEndpoint, final String endpointWs) {

        // Build a credential authentication configuration if you want to directly connect to the IoT Things service
        // via its websocket channel.
        final ClientCredentialsAuthenticationConfiguration.Builder clientCredentialsAuthenticationConfigurationBuilder =
                ClientCredentialsAuthenticationConfiguration
                        .newBuilder()
                        .clientId(clientId)
                        .clientSecret(clientSecret)
                        .tokenEndpoint(tokenEndpoint);


        final MessagingConfiguration.Builder messagingProviderConfigurationBuilder = WebSocketMessagingConfiguration.
                newBuilder()
                .jsonSchemaVersion(JsonSchemaVersion.V_2)
                .reconnectEnabled(false);

        if (endpointWs != null) {
            messagingProviderConfigurationBuilder.endpoint(endpointWs);
        }

        proxyConfiguration().ifPresent(messagingProviderConfigurationBuilder::proxyConfiguration);
        proxyConfiguration().ifPresent(clientCredentialsAuthenticationConfigurationBuilder::proxyConfiguration);

        MessagingProvider messagingProvider =
                MessagingProviders.webSocket(messagingProviderConfigurationBuilder.build(),
                        AuthenticationProviders.clientCredentials(
                                (ClientCredentialsAuthenticationConfiguration) clientCredentialsAuthenticationConfigurationBuilder
                                        .build()));

        return messagingProvider;
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

    protected String generateRandomThingId() {
        return namespace + ":" + UUID.randomUUID().toString();
    }

    protected String generateRandomThingId(final String prefix) {
        return namespace + ":" + prefix + UUID.randomUUID().toString();
    }

    /**
     * Sets up a serializer/deserializer for the {@link ExampleUser} model class which uses JAXB in order to serialize
     * and deserialize messages which should directly be mapped to this type.
     */
    private MessageSerializerRegistry setupCustomMessageSerializer() {
        final JAXBContext jaxbContext;
        try {
            jaxbContext = JAXBContext.newInstance(ExampleUser.class);
        } catch (final JAXBException e) {
            throw new RuntimeException("Could not setup JAXBContext", e);
        }

        final MessageSerializerRegistry serializerRegistry =
                MessageSerializerFactory.initializeDefaultSerializerRegistry();

        serializerRegistry.registerMessageSerializer(
                MessageSerializers.of(ExampleUser.USER_CUSTOM_CONTENT_TYPE, ExampleUser.class, "*",
                        (exampleUser, charset) -> {
                            try {
                                final Marshaller marshaller = jaxbContext.createMarshaller();
                                marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
                                final ByteArrayOutputStream os = new ByteArrayOutputStream();
                                marshaller.marshal(exampleUser, os);
                                return ByteBuffer.wrap(os.toByteArray());
                            } catch (final JAXBException e) {
                                throw new RuntimeException("Could not serialize", e);
                            }
                        }, (byteBuffer, charset) -> {
                            try {
                                final Unmarshaller jaxbUnmarshaller = jaxbContext.createUnmarshaller();
                                final ByteArrayInputStream is = new ByteArrayInputStream(byteBuffer.array());
                                return (ExampleUser) jaxbUnmarshaller.unmarshal(is);
                            } catch (final JAXBException e) {
                                throw new RuntimeException("Could not deserialize", e);
                            }
                        }));
        return serializerRegistry;
    }

    /**
     * Destroys the client and waits for its graceful shutdown.
     */
    public void terminate() {
        client.destroy();
        client2.destroy();
    }
}
