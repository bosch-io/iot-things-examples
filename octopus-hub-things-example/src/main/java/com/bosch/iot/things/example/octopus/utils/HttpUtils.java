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
package com.bosch.iot.things.example.octopus.utils;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClientConfig;
import org.asynchttpclient.proxy.ProxyServer;

public class HttpUtils {

    public static final long REQUEST_TIMEOUT_IN_SECONDS = 5;
    public static final String CONTENT_TYPE_HEADER_NAME = "Content-Type";
    public static final String AUTHORIZATION_HEADER_NAME = "Authorization";
    public static final String APPLICATION_JSON_CONTENT_TYPE = "application/json";

    private HttpUtils() {
        throw new AssertionError();
    }

    public static AsyncHttpClient getConfiguredHttpClient() {
        final DefaultAsyncHttpClientConfig.Builder builder = new DefaultAsyncHttpClientConfig.Builder();

        proxyConfig().ifPresent(builder::setProxyServer);

        return new DefaultAsyncHttpClient(builder.build());
    }

    private static Optional<ProxyServer> proxyConfig() {
        final Map<String, String> environmentVariables = System.getenv();
        final String httpProxy = environmentVariables.getOrDefault("HTTP_PROXY", "");

        if (!httpProxy.isEmpty()) {
            try {
                final URL httpProxyUrl = new URL(httpProxy);

                final String proxyHost = httpProxyUrl.getHost();
                final int proxyPort = httpProxyUrl.getPort();

                return Optional.of(new ProxyServer.Builder(proxyHost, proxyPort).build());
            } catch (final MalformedURLException e) {
                throw new IllegalStateException("Configured proxy configuration is malformed: " + httpProxy, e);
            }
        }

        return Optional.empty();
    }

    public static String buildBasicAuthHeaderValue(final String username, final String password) {
        return "Basic " + Base64.getEncoder().encodeToString(String.format("%s:%s", username, password).getBytes());
    }
}
