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

package com.bosch.cr.examples.carintegrator;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Properties;
import java.util.Random;
import java.util.TreeSet;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import io.netty.util.internal.ThreadLocalRandom;

import com.bosch.cr.integration.IntegrationClient;
import com.bosch.cr.integration.SubscriptionConsumeOptions;
import com.bosch.cr.integration.client.IntegrationClientImpl;
import com.bosch.cr.integration.client.configuration.AuthenticationConfiguration;
import com.bosch.cr.integration.client.configuration.IntegrationClientConfiguration;
import com.bosch.cr.integration.client.configuration.ProxyConfiguration;
import com.bosch.cr.integration.client.configuration.PublicKeyAuthenticationConfiguration;
import com.bosch.cr.integration.client.configuration.TrustStoreConfiguration;
import com.bosch.cr.integration.things.ChangeAction;
import com.bosch.cr.json.JsonFactory;
import com.bosch.cr.json.JsonObject;
import com.bosch.cr.model.things.Thing;

/**
 * Example implementation of a "Gateway" that brings devices into your Solution.
 * This example simulates vehicle movements.
 */

public class VehicleSimulator
{

   private static boolean shouldRun = true;

   public static void main(String[] args) throws Exception
   {
      Properties props = new Properties(System.getProperties());
      try
      {
         if (new File("config.properties").exists())
         {
            props.load(new FileReader("config.properties"));
         }
         else
         {
            InputStream i = Thread.currentThread().getContextClassLoader().getResourceAsStream("config.properties");
            props.load(i);
            i.close();
         }
         System.out.println("Config: " + props);
      }
      catch (IOException ex)
      {
         throw new RuntimeException(ex);
      }

      String thingsServiceMessagingUrl = props.getProperty("thingsServiceMessagingUrl");

      String clientId = props.getProperty("clientId");

      URI keystoreUri = new File("CRClient.jks").toURI();
      String keystorePassword = props.getProperty("keyStorePassword");
      String keyAlias = props.getProperty("keyAlias");
      String keyAliasPassword = props.getProperty("keyAliasPassword");

      String proxyHost = props.getProperty("http.proxyHost");
      String proxyPort = props.getProperty("http.proxyPort");

      AuthenticationConfiguration authenticationConfiguration =
         PublicKeyAuthenticationConfiguration.newBuilder().clientId(clientId).keyStoreLocation(keystoreUri.toURL())
            .keyStorePassword(keystorePassword).alias(keyAlias).aliasPassword(keyAliasPassword).build();

      TrustStoreConfiguration trustStore =
         TrustStoreConfiguration.newBuilder().location(VehicleSimulator.class.getResource("/bosch-iot-cloud.jks"))
            .password("jks").build();

      IntegrationClientConfiguration.OptionalConfigSettable configSettable =
         IntegrationClientConfiguration.newBuilder()
                 .authenticationConfiguration(authenticationConfiguration)
                 .centralRegistryEndpointUrl(thingsServiceMessagingUrl)
                 .trustStoreConfiguration(trustStore);
      if (proxyHost != null && proxyPort != null)
      {
         configSettable = configSettable.proxyConfiguration(
            ProxyConfiguration.newBuilder().proxyHost(proxyHost).proxyPort(Integer.parseInt(proxyPort)).build());
      }

      IntegrationClient client = IntegrationClientImpl.newInstance(configSettable.build());


      TreeSet<String> activeThings = new TreeSet<>();
      activeThings.addAll(readActiveThings());

      System.out.println("Started...");
      System.out.println("Active things: " + activeThings);


      client.things().registerForThingChanges("lifecycle", change -> {
         if (change.getAction() == ChangeAction.CREATED && change.isFull())
         {
            activeThings.add(change.getThingId());
            writeActiveThings(activeThings);
            System.out.println("New thing " + change.getThingId() + " created -> active things: " + activeThings);
         }
      });

      client.subscriptions().create(SubscriptionConsumeOptions.newBuilder().enableConsumeOwnEvents().build()).get(10, TimeUnit.SECONDS);
      client.subscriptions().consume().get(10, TimeUnit.SECONDS);

      Thread thread = new Thread(() -> {
         Random random = ThreadLocalRandom.current();
         while (shouldRun)
         {
            for (String thingId : activeThings)
            {

               try
               {
                  Thing thing = client.things().forId(thingId)
                     .retrieve(JsonFactory.newFieldSelector("thingId", "features/geolocation/properties/geoposition"))
                     .get(5, TimeUnit.SECONDS);

                  if (!thing.getFeatures().isPresent() || !thing.getFeatures().get().getFeature("geolocation")
                     .isPresent())
                  {
                     System.out.println("Thing " + thingId + " has no Feature \"geolocation\"");
                     return;
                  }

                  JsonObject geolocation =
                     thing.getFeatures().get().getFeature("geolocation").orElseThrow(RuntimeException::new)
                        .getProperties().get();
                  double latitude =
                     geolocation.getValue(JsonFactory.newPointer("geoposition/latitude")).get().asDouble();
                  double longitude =
                     geolocation.getValue(JsonFactory.newPointer("geoposition/longitude")).get().asDouble();
                  JsonObject newGeoposition =
                     JsonFactory.newObjectBuilder().set("latitude", latitude + (random.nextDouble() - 0.5) / 250)
                        .set("longitude", longitude + (random.nextDouble() - 0.5) / 250).build();

                  client.things().forFeature(thingId, "geolocation").putProperty("geoposition", newGeoposition).get(5, TimeUnit.SECONDS);

                  System.out.print(".");
                  if (random.nextDouble() < 0.01)
                  {
                     System.out.println();
                  }
                  Thread.sleep(250);
               }
               catch (InterruptedException e)
               {
                  System.out.println("Update thread interrupted");
                  return;
               }
               catch (ExecutionException | TimeoutException e)
               {
                  System.out.println("Retrieve thing " + thingId + " failed: " + e);
               }
            }
         }
      });

      thread.start();

      System.out.println("Press enter to terminate");
      System.in.read();

      System.out.println("Shutting down ...");
      shouldRun = false;
      Thread.sleep(5000);
      client.destroy();
      System.out.println("Client destroyed");
   }

   private static Collection<String> readActiveThings()
   {
      Properties p = new Properties();
      try
      {
         FileReader r = new FileReader("things.properties");
         p.load(r);
         r.close();
         return Arrays.asList(p.getProperty("thingIds").split(","));
      }
      catch (FileNotFoundException ex)
      {
         return Collections.emptyList();
      }
      catch (IOException ex)
      {
         throw new RuntimeException(ex);
      }
   }

   private static void writeActiveThings(TreeSet<String> activeThings)
   {
      Properties p = new Properties();
      p.setProperty("thingIds", String.join(",", activeThings));
      try
      {
         FileWriter w = new FileWriter("things.properties");
         p.store(w, "List of currently managed things by this gateway");
         w.close();
      }
      catch (IOException ex)
      {
         throw new RuntimeException(ex);
      }
   }

}
