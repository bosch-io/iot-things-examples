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
package com.bosch.iot.things.example.http;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Paths;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClientConfig;
import org.asynchttpclient.ListenableFuture;
import org.asynchttpclient.Realm;
import org.asynchttpclient.Response;
import org.asynchttpclient.proxy.ProxyServer;

/**
 * Example to show Signature Authentication for authenticating technical clients at the HTTP interface of the Bosch IoT
 * Things service.
 */
public class SignatureAuthenticationExample {

    private static final String HTTP_HEADER_CONTENT_TYPE = "Content-Type";
    private static final String CONTENT_TYPE_JSON = "application-json";
    private static final String CONFIG_PROPERTIES_FILE = "config.properties";

    private String thingsServiceEndpointUrl;
    private AsyncHttpClient asyncHttpClient;
    private String thingId;

    /**
     * Read configuration from file and setup the HTTP client.
     **/
    public SignatureAuthenticationExample() throws IOException {
        final Properties props = new Properties(System.getProperties());
        final FileReader r;
        if (Paths.get(CONFIG_PROPERTIES_FILE).toFile().exists()) {
            r = new FileReader(Paths.get(CONFIG_PROPERTIES_FILE).toFile());
        } else {
            r = new FileReader(SignatureAuthenticationExample.class.getClassLoader()
                    .getResource(CONFIG_PROPERTIES_FILE)
                    .getFile());
        }
        props.load(r);
        r.close();

        thingsServiceEndpointUrl =
                props.getProperty("thingsServiceEndpointUrl");

        final String clientId = props.getProperty("clientId");
        final String apiToken = props.getProperty("apiToken");
        final String namespace = props.getProperty("namespace");

        final URI keystoreUri = new File(props.getProperty("keystoreLocation")).toURI();
        final String keystorePassword = props.getProperty("keystorePassword");
        final String keystoreAlias = props.getProperty("keystoreAlias");
        final String keystoreAliasPassword = props.getProperty("keystoreAliasPassword");

        final SignatureFactory signatureFactory =
                SignatureFactory.newInstance(keystoreUri, keystorePassword, keystoreAlias, keystoreAliasPassword);

        final DefaultAsyncHttpClientConfig.Builder builder = new DefaultAsyncHttpClientConfig.Builder();
        final String proxyHost = props.getProperty("proxyHost");
        final String proxyPort = props.getProperty("proxyPort");
        final String proxyPrincipal = props.getProperty("proxyPrincipal");
        final String proxyPassword = props.getProperty("proxyPassword");
        if (proxyHost != null && proxyPort != null) {
            final ProxyServer.Builder proxyBuilder = new ProxyServer.Builder(proxyHost, Integer.valueOf(proxyPort));
            if (proxyPrincipal != null && proxyPassword != null) {
                // proxy with authentication
                proxyBuilder.setRealm(new Realm.Builder(proxyPrincipal, proxyPassword).setScheme(Realm.AuthScheme.BASIC)
                        .setUsePreemptiveAuth(true));
            }
            builder.setProxyServer(proxyBuilder);
        }

        asyncHttpClient = new DefaultAsyncHttpClient(builder.build());
        asyncHttpClient.setSignatureCalculator(
                new AsymmetricalSignatureCalculator(signatureFactory, clientId, apiToken));

        thingId = namespace + ":myThing-" + UUID.randomUUID().toString();
    }

    public void terminate() throws IOException {
        asyncHttpClient.close();
    }

    /**
     * PUT a Thing with CRS Authentication.
     */
    public void putThingWithCRS() throws ExecutionException, InterruptedException {
        final String thingJsonString = "{}";
        final String path = "/api/1/things/" + thingId;

        final ListenableFuture<Response> future = asyncHttpClient.preparePut(thingsServiceEndpointUrl + path) //
                .addHeader(HTTP_HEADER_CONTENT_TYPE, CONTENT_TYPE_JSON) //
                .setBody(thingJsonString) //
                .execute();

        final Response response = future.get();
        System.out.println("Response code is: " + response.getStatusCode());
    }

    /**
     * Delete a Thing with CRS Authentication.
     */
    public void deleteThingWithCRS() throws ExecutionException, InterruptedException {
        final String path = "/api/1/things/" + thingId;

        final ListenableFuture<Response> future = asyncHttpClient.prepareDelete(thingsServiceEndpointUrl + path) //
                .execute();

        final Response response = future.get();
        System.out.println("Response code is: " + response.getStatusCode());
    }

    public static void main(String[] args) throws Exception {
        final SignatureAuthenticationExample example = new SignatureAuthenticationExample();
        example.putThingWithCRS();
        example.deleteThingWithCRS();
        example.terminate();
    }
}