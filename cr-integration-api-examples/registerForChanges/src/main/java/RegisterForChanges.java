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

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.cr.integration.things.ChangeAction;
import com.bosch.cr.integration.things.ThingHandle;
import com.bosch.cr.json.JsonFactory;
import com.bosch.cr.json.JsonValue;

/**
 * This example shows the various possibilities that the {@code IntegrationClient} offers for registering
 * handlers to be informed about {@link com.bosch.cr.integration.things.ThingChange}s and
 * {@link com.bosch.cr.integration.things.Change}s of your {@code Thing}s.
 * NOTE: Make sure to invoke {@code IntegrationClient.subscriptions().consume()} once after all handlers are
 * registered to start receiving events.
 */
public final class RegisterForChanges extends ExamplesBase
{
   private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForChanges.class);

   private static final String ALL_THINGS = "allThings";
   private static final String MY_THING = "myThing";
   private static final String ALL_THINGS_ATTRIBUTE_CHANGE = "allThings_attributeChanges";
   private static final String ALL_THINGS_SPECIFIC_ATTRIBUTE_CHANGE = "allThings_specificAttributeChanges";
   private static final String MY_THING_ATTRIBUTE_CHANGE = "myThing_attributeChanges";
   private static final String MY_THING_SPECIFIC_ATTRIBUTE_CHANGE = "myThing_specificAttributeChanges";
   private static CountDownLatch countDownLatch;

   /**
    * Set up the count down latch to wait until the changes were received.
    */
   public void setUpCountDownLatch()
   {
      countDownLatch = new CountDownLatch(2);
   }

   /**
    * Register for {@code ThingChange}s.
    */
   public void registerForThingChanges()
   {
      /* Register for change events of *all* things */
      client.things().registerForThingChanges(ALL_THINGS, change ->
      {
         LOGGER.info("For all things: ThingChange received: {}", change);
         countDownLatch.countDown();
      });

      /* Register for *all* change events of a *specific* thing */
      myThing.registerForThingChanges(MY_THING, change -> LOGGER.info("My Thing: ThingChange received: {}", change));
   }

   /**
    * Register for {@code ImmutableThingAttributeChange}s.
    */
   public void registerForAttributeChanges()
   {
      /* Register for *all* attribute changes of *all* things */
      client.things().registerForAttributesChanges(ALL_THINGS_ATTRIBUTE_CHANGE,
         change -> LOGGER.info("For all things: Change received: {}", change));

      /* Register for *specific* attribute changes of *all* things */
      client.things()
         .registerForAttributeChanges(ALL_THINGS_SPECIFIC_ATTRIBUTE_CHANGE, JsonFactory.newPointer("address/city"),
            change -> LOGGER.info("For all things with specific Attribute: Change received: {}", change));

      /* Register for *all* attribute changes of a *specific* thing */
      myThing.registerForAttributesChanges(MY_THING_ATTRIBUTE_CHANGE, change ->
      {
         final Optional<JsonValue> value = change.getValue() //
            .map(JsonValue::asObject) // "attributes" is a JsonObject
            .flatMap(jsonObj -> jsonObj.getValue(change.getPath()));
         LOGGER.info("My Thing: Change received: {} - value was: {}", change, value);
      });

      /* Register for *specific* attribute changes of a *specific* thing */
      myThing.registerForAttributeChanges(MY_THING_SPECIFIC_ATTRIBUTE_CHANGE, JsonFactory.newPointer("address/city"),
         change -> LOGGER.info("My Thing with specific Attribute: attributeChange received: {}", change));
   }

   /**
    * Register for {@code ThingChange}s and deregister after the created-event has been retrieved.
    */
   public void registerForThingChangesWithDeregistration()
      throws InterruptedException, ExecutionException, TimeoutException
   {
      final String registrationId = UUID.randomUUID().toString();
      final String thingId = "com.bosch.cr.example:" + UUID.randomUUID().toString();
      final ThingHandle thingHandle = client.things().forId(thingId);

      /* Register for *all* change events of a *specific* thing */
      LOGGER.info("Register handler with id: {}", registrationId);
      thingHandle.registerForThingChanges(registrationId, change ->
      {
         LOGGER.info("{}: ThingChange received: {}", thingId, change);
         /* Deregister when the created-event has been retrieved */
         if (change.getAction() == ChangeAction.CREATED)
         {
            LOGGER.info("{}: Deregister handler with id: {}", thingId, registrationId);
            thingHandle.deregister(registrationId);
            countDownLatch.countDown();
         }
      });

      client.things().create(thingId).get(10, TimeUnit.SECONDS);
   }

   public void destroy() throws InterruptedException
   {
      boolean allMessagesReceived = countDownLatch.await(10, TimeUnit.SECONDS);
      LOGGER.info("All changes received: {}", allMessagesReceived);
      client.destroy();
   }
}
