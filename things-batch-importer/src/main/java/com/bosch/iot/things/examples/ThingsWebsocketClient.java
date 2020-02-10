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
package com.bosch.iot.things.examples;

import static java.util.Optional.of;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.Properties;

import org.eclipse.ditto.client.DittoClient;
import org.eclipse.ditto.client.DittoClients;
import org.eclipse.ditto.client.configuration.AuthenticationConfiguration.Builder;
import org.eclipse.ditto.client.configuration.ClientCredentialsAuthenticationConfiguration;
import org.eclipse.ditto.client.configuration.MessagingConfiguration;
import org.eclipse.ditto.client.configuration.ProxyConfiguration;
import org.eclipse.ditto.client.configuration.WebSocketMessagingConfiguration;
import org.eclipse.ditto.client.messaging.AuthenticationProviders;
import org.eclipse.ditto.client.messaging.MessagingProvider;
import org.eclipse.ditto.client.messaging.MessagingProviders;
import org.eclipse.ditto.client.twin.Twin;
import org.eclipse.ditto.model.base.json.JsonSchemaVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class ThingsWebsocketClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(ThingsWebsocketClient.class);
    private static final String CONFIG_PROPERTIES_FILE = "config.properties";
    private static final String CONFIG_FILE = "thingsConfigFile";

    private final DittoClient client;
    private final Twin twin;

    private final String webSocketEndpoint;

    private final String clientId;
    private final String clientSecret;
    private final String tokenEndpoint;

    private final String proxyHost;
    private final String proxyPort;
    private final String proxyPrincipal;
    private final String proxyPassword;

    /**
     * Constructor.
     */
    ThingsWebsocketClient() {

        final Properties props = loadConfigurationFromFile();

        webSocketEndpoint = props.getProperty("webSocketEndpoint");

        clientId = props.getProperty("clientId");
        clientSecret = props.getProperty("clientSecret");
        tokenEndpoint = props.getProperty("tokenEndpoint");

        proxyHost = props.getProperty("proxyHost");
        proxyPort = props.getProperty("proxyPort");
        proxyPrincipal = props.getProperty("proxyPrincipal");
        proxyPassword = props.getProperty("proxyPassword");

        LOGGER.info("Creating Things Client ...");
        // Create a new ThingsWebsocketClient object to start interacting with IoT Things service
        client = createClient();

        // Create a new twin client for managing things
        twin = client.twin();
    }

    Twin getTwin() {
        return twin;
    }

    /**
     * Destroys the client and waits for its graceful shutdown.
     */
    void terminate() {
        client.destroy();
        LOGGER.info("Things Client destroyed ...");
    }

    private Properties loadConfigurationFromFile() {
        final Properties props = new Properties(System.getProperties());
        final String configPropertiesFile = System.getProperty(CONFIG_FILE);
        if (configPropertiesFile == null) {
            LOGGER.error("File '{}' could not be found but is required to start this tool!", CONFIG_FILE);
            System.exit(-1);
        }

        try (final BufferedReader reader = Files.newBufferedReader(Paths.get(configPropertiesFile))) {
            props.load(reader);
        } catch (IOException ioe) {
            LOGGER.error("File '{}' could not be opened but is required for this tool: '{}'", CONFIG_PROPERTIES_FILE,
                    ioe.getMessage());
            System.exit(-1);
        }
        return props;
    }

    private DittoClient createClient() {

        // Build a client-credential authentication configuration if you want to directly connect to the IoT Things service
        // via its websocket channel.
        final Builder clientCredentialsAuthenticationConfigurationBuilder =
                ClientCredentialsAuthenticationConfiguration
                        .newBuilder()
                        .clientId(clientId)
                        .clientSecret(clientSecret)
                        .tokenEndpoint(tokenEndpoint);

        final MessagingConfiguration.Builder messagingProviderConfigurationBuilder = WebSocketMessagingConfiguration.
                newBuilder()
                .jsonSchemaVersion(JsonSchemaVersion.V_2)
                .reconnectEnabled(false)
                .endpoint(webSocketEndpoint);

        proxyConfiguration().ifPresent(messagingProviderConfigurationBuilder::proxyConfiguration);
        proxyConfiguration().ifPresent(clientCredentialsAuthenticationConfigurationBuilder::proxyConfiguration);

        MessagingProvider messagingProvider =
                MessagingProviders.webSocket(messagingProviderConfigurationBuilder.build(),
                        AuthenticationProviders.clientCredentials((ClientCredentialsAuthenticationConfiguration)
                                clientCredentialsAuthenticationConfigurationBuilder.build()));

        return DittoClients.newInstance(messagingProvider);
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
