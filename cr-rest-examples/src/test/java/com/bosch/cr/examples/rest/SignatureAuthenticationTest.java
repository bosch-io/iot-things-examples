/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2016 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
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
package com.bosch.cr.examples.rest;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
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
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.assertEquals;

/**
 * Unit test to show Signature Authentication for authenticating technical clients at the RESTful interface 
 * of the Bosch IoT Things service
 *
 * @since 1.0.0
 */
public class SignatureAuthenticationTest
{

   private static final String HTTP_HEADER_CONTENT_TYPE = "Content-Type";
   private static final String CONTENT_TYPE_JSON = "application-json";

   private static final int HTTP_STATUS_CREATED = 201;
   private static final int HTTP_STATUS_NO_CONTENT = 204;

   private static String thingsServiceEndpointUrl;
   private static AsyncHttpClient asyncHttpClient;
   private static String thingId;

   /** */
   @BeforeClass
   public static void setUp() throws KeyManagementException, NoSuchAlgorithmException, IOException
   {
      final Properties props = new Properties(System.getProperties());
      final FileReader r;
      if (Files.exists(Paths.get("config.properties")))
      {
         r = new FileReader(Paths.get("config.properties").toFile());
      }
      else
      {
         r = new FileReader(
            SignatureAuthenticationTest.class.getClassLoader().getResource("config.properties").getFile());
      }
      props.load(r);
      r.close();

      thingsServiceEndpointUrl = props.getProperty("thingsServiceEndpointUrl", props.getProperty("centralRegistryEndpointUrl"));

      final String clientId = props.getProperty("clientId");
      final String apiToken = props.getProperty("apiToken");

      final URI keystoreUri = new File(props.getProperty("keystoreLocation")).toURI();
      final String keyStorePassword = props.getProperty("keyStorePassword");
      final String keyAlias = props.getProperty("keyAlias");
      final String keyAliasPassword = props.getProperty("keyAliasPassword");

      final SignatureFactory signatureFactory =
         SignatureFactory.newInstance(keystoreUri, keyStorePassword, keyAlias, keyAliasPassword);

      final DefaultAsyncHttpClientConfig.Builder builder = new DefaultAsyncHttpClientConfig.Builder();
      builder.setAcceptAnyCertificate(true); // WORKAROUND: Trust self-signed certificate of BICS until there is a trusted one.

      final String proxyHost = props.getProperty("http.proxyHost");
      final String proxyPort = props.getProperty("http.proxyPort");
      final String proxyPrincipal = props.getProperty("http.proxyPrincipal");
      final String proxyPassword = props.getProperty("http.proxyPassword");
      if (proxyHost != null && proxyPort != null)
      {
         final ProxyServer.Builder proxyBuilder = new ProxyServer.Builder(proxyHost, Integer.valueOf(proxyPort));
         if (proxyPrincipal != null && proxyPassword != null)
         {
            // proxy with authentication
            proxyBuilder.setRealm(new Realm.Builder(proxyPrincipal, proxyPassword).setScheme(Realm.AuthScheme.BASIC).setUsePreemptiveAuth(true));
         }
         builder.setProxyServer(proxyBuilder);
      }

      asyncHttpClient = new DefaultAsyncHttpClient(builder.build());
      asyncHttpClient.setSignatureCalculator(new AsymmetricalSignatureCalculator(signatureFactory, clientId, apiToken));

      thingId = "com.bosch.cr.example:myThing-" + UUID.randomUUID().toString();
   }

   /**
    * PUT a Thing with CRS Authentication.
    *
    * @throws ExecutionException
    * @throws InterruptedException
    */
   @Test
   public void putThingWithCRS() throws ExecutionException, InterruptedException
   {
      final String thingJsonString = "{}";
      final String path = "/api/1/things/" + thingId;

      final ListenableFuture<Response> future = asyncHttpClient.preparePut(thingsServiceEndpointUrl + path) //
         .addHeader(HTTP_HEADER_CONTENT_TYPE, CONTENT_TYPE_JSON) //
         .setBody(thingJsonString) //
         .execute();

      final Response response = future.get();
      assertEquals(HTTP_STATUS_CREATED, response.getStatusCode());
   }

   /**
    * Delete a Thing with CRS Authentication.
    *
    * @throws ExecutionException
    * @throws InterruptedException
    */
   @Test
   public void deleteThingWithCRS() throws ExecutionException, InterruptedException
   {
      final String path = "/api/1/things/" + thingId;

      final ListenableFuture<Response> future = asyncHttpClient.prepareDelete(thingsServiceEndpointUrl + path) //
         .execute();

      final Response response = future.get();
      assertEquals(HTTP_STATUS_NO_CONTENT, response.getStatusCode());
   }

}
