import static java.util.concurrent.TimeUnit.SECONDS;

import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.cr.integration.things.ThingHandle;
import com.bosch.cr.integration.things.ThingIntegration;
import com.bosch.cr.json.JsonFactory;
import com.bosch.cr.json.JsonPointer;
import com.bosch.cr.json.JsonValue;
import com.bosch.cr.model.things.Thing;
import com.bosch.cr.model.things.ThingsModelFactory;

/**
 * This example shows how a {@link ThingHandle}  can be used to perform CRUD (Create, Read,
 * Update, and Delete) operations on {@link com.bosch.cr.model.attributes.Attributes} of a thing.
 */
public class ManageAttributes extends ExamplesBase
{
   private static final Logger LOGGER = LoggerFactory.getLogger(ManageAttributes.class);

   private static final String NAMESPACE = "com.bosch.cr.integration.examples.ManageAttributes:";
   private static final JsonPointer ATTRIBUTE_JSON_POINTER1 = JsonFactory.newPointer("location");
   private static final JsonValue ATTRIBUTE_JSON_VALUE1 = JsonFactory.newValue(43.652);
   private static final JsonValue NEW_ATTRIBUTE_JSON_VALUE = JsonFactory.newValue(21.981);
   private static final JsonPointer ATTRIBUTE_JSON_POINTER2 = JsonFactory.newPointer("height");
   private static final JsonValue ATTRIBUTE_JSON_VALUE2 = JsonFactory.newValue(13398);

   private static final int TIMEOUT = 5;


   public void crudAttributes() throws InterruptedException, ExecutionException, TimeoutException
   {
      LOGGER.info("Starting: {}()", Thread.currentThread().getStackTrace()[1].getMethodName());

      final String thingId = NAMESPACE + UUID.randomUUID().toString();
      final Thing thing = ThingsModelFactory.newThingBuilder() //
         .setId(thingId) //
         .setAttribute(ATTRIBUTE_JSON_POINTER1, ATTRIBUTE_JSON_VALUE1) //
         .setAttribute(ATTRIBUTE_JSON_POINTER2, ATTRIBUTE_JSON_VALUE2) //
         .build();

      final ThingIntegration thingIntegration = client.things();
      thingIntegration.create(thing).get(TIMEOUT, SECONDS);
      final ThingHandle thingHandle = thingIntegration.forId(thingId);


      thingHandle.putAttribute(ATTRIBUTE_JSON_POINTER1, NEW_ATTRIBUTE_JSON_VALUE) //
         .thenCompose(aVoid -> thingHandle.retrieve()) //
         .thenAccept(thing1 -> LOGGER.info("RETRIEVED thing is {}", thing1.toJsonString())) //
         .thenCompose(aVoid1 -> thingHandle.deleteAttributes()) //
         .thenCompose(aVoid2 -> thingHandle.retrieve()) //
         .thenAccept(
            thing2 -> LOGGER.info("RETRIEVED thing after attributes where deleted is {}", thing2.toJsonString()))
         .get(5, TimeUnit.SECONDS);
   }

   public void destroy() throws InterruptedException
   {
      client.destroy();
   }
}
