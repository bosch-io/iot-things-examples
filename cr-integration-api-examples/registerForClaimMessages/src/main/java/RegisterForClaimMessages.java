/* Copyright (c) 2011-2015 Bosch Software Innovations GmbH, Germany. All rights reserved. */

import java.nio.ByteBuffer;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.cr.integration.messages.RepliableMessage;
import com.bosch.cr.integration.things.ThingHandle;
import com.bosch.cr.json.JsonFactory;
import com.bosch.cr.model.acl.AccessControlListModelFactory;
import com.bosch.cr.model.acl.AclEntry;
import com.bosch.cr.model.authorization.AuthorizationContext;
import com.bosch.cr.model.authorization.AuthorizationModelFactory;
import com.bosch.cr.model.authorization.AuthorizationSubject;
import com.bosch.cr.model.common.HttpStatusCode;
import com.bosch.cr.model.things.Thing;
import com.bosch.cr.model.things.ThingsModelFactory;

/**
 * This example shows how to register for- and reply to claim messages with the CR Integration Client.
 *
 * @since 3.1.0
 */
public final class RegisterForClaimMessages extends ExamplesBase
{
   private static final Logger LOGGER = LoggerFactory.getLogger(RegisterForClaimMessages.class);
   private static final String NAMESPACE = "com.bosch.cr.example:";

   private final String registrationIdAllClaimMessages;
   private final String registrationIdClaimMessagesForThing;

   private RegisterForClaimMessages()
   {
      registrationIdAllClaimMessages = UUID.randomUUID().toString();
      registrationIdClaimMessagesForThing = UUID.randomUUID().toString();
   }

   public static RegisterForClaimMessages newInstance()
   {
      return new RegisterForClaimMessages();
   }

   /**
    * Registers for claim messages sent to all things.
    * To claim the prepared Thing, you can use our swagger documentation provided at
    * https://things.apps.bosch-iot-cloud.com/ or any other REST client.
    */
   public void registerForClaimMessagesToAllThings()
   {
      prepareClaimableThing() //
         .thenAccept(thingHandle ->
         {
            client.things().registerForClaimMessage(registrationIdAllClaimMessages, this::handleMessage);
            LOGGER.info("Thing '{}' ready to be claimed", thingHandle.getThingId());
         });
   }

   /**
    * Registers for claim messages sent to a single Thing.
    * To claim the prepared Thing, you can use our swagger documentation provided at
    * https://things.apps.bosch-iot-cloud.com/ or any other REST client.
    */
   public void registerForClaimMessagesToSingleThing()
   {
      prepareClaimableThing() //
         .thenAccept(thingHandle ->
         {
            thingHandle.registerForClaimMessage(registrationIdClaimMessagesForThing, this::handleMessage);
            LOGGER.info("Thing '{}' ready to be claimed!", thingHandle.getThingId());
         });
   }

   private CompletableFuture<ThingHandle> prepareClaimableThing()
   {
      final String thingId = NAMESPACE + UUID.randomUUID().toString();
      final Thing thing = ThingsModelFactory.newThingBuilder() //
         .setId(thingId) //
         .setPermissions(AuthorizationModelFactory.newAuthSubject(ExamplesBase.CLIENT_ID),
            AccessControlListModelFactory.allPermissions()) //
         .build();

      return client.things().create(thing).thenApply(created -> client.things().forId(thingId));
   }

   private void handleMessage(final RepliableMessage<ByteBuffer, Object> message)
   {
      final Optional<AuthorizationContext> optionalAuthorizationContext = message.getAuthorizationContext();
      if (optionalAuthorizationContext.isPresent())
      {
         final String thingId = message.getThingId();
         final AuthorizationContext authorizationContext = optionalAuthorizationContext.get();
         final AuthorizationSubject authorizationSubject = authorizationContext.getFirstAuthorizationSubject().get();
         final AclEntry aclEntry = AccessControlListModelFactory
            .newAclEntry(authorizationSubject, AccessControlListModelFactory.allPermissions());

         client.things().forId(thingId) //
            .retrieve() //
            .thenCompose(thing -> client.things().update(thing.setAclEntry(aclEntry))) //
            .whenComplete((aVoid, throwable) ->
            {
               if (null != throwable)
               {
                  message.reply() //
                     .statusCode(HttpStatusCode.BAD_GATEWAY) //
                     .timestamp(OffsetDateTime.now()) //
                     .payload("Error: Claiming failed. Please try again later.") //
                     .contentType("text/plain") //
                     .send();
                  LOGGER.info("Update failed: '{}'", throwable.getMessage());
               }
               else
               {
                  message.reply() //
                     .statusCode(HttpStatusCode.OK) //
                     .timestamp(OffsetDateTime.now()) //
                     .payload(JsonFactory.newObjectBuilder().set("success", true).build()) //
                     .contentType("application/json") //
                     .send();
                  LOGGER.info("Thing '{}' claimed from authorization subject '{}'", thingId, authorizationSubject);
               }
            });
      }
      else
      {
         message.reply() //
            .statusCode(HttpStatusCode.BAD_REQUEST) //
            .timestamp(OffsetDateTime.now()) //
            .payload("Error: no authorization context present.") //
            .contentType("text/plain") //
            .send();
      }
   }
}
