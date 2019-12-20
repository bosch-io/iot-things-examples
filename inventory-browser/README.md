# Bosch IoT Things - Example Inventory Browser

This example shows how to create a simple user interface to list things and their details and show the things on a map.

![Screenshot](screenshot.png)

# Prerequisites

The following background knowledge is required for this example
- Maven
- Java
- JavaScript

# Use an existing or request a new Bosch IoT Things service instance

Book the Bosch IoT Things cloud service as described in our [documentation](https://docs.bosch-iot-suite.com/things/getting-started/booking/). Follow the guide to manage your [namespace](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-namespace/).\
Book the Bosch IoT Permission cloud service and register one user as described [in our demo](https://docs-staging.bosch-iot-suite.com/things/examples-demo/createuser/).

# Configure your API Token and other settings

Create or adjust file `src/main/resources/config.properties`

```
thingsServiceEndpointUrl=### Your Things Solution endpoint_http ###
apiToken=### your Bosch IoT Things Solution API Token ###
http.proxyHost=### your http proxy host, if you need one ###
http.proxyPort=### your http proxy port, if you need one ###
```

# Build

Use the following maven command to build the server:
```
mvn clean install
```

# Run Server

Use the following command to run the server.
```
java -jar target/inventory-browser.jar
```

# Usage

## Show Inventory Browser

Browse to the example web app: <http://localhost:8080/inventory-browser/> and register with your permissions user. (Note that username = Permission-TenantName\Username)

## Create Thing for Herbie

Use our [http API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/Things/put_things__thingId_) to create a thing, which you can track. Authenticate with the same permissions user as in your Inventory Browser.

Use this in the request body to set the attributes and features:
```
{
   "attributes":{
      "name":"Herbie 53",
      "manufacturer":"VW",
      "VIN":"5313879"
   },
   "features":{
      "geolocation":{
         "definition": [ "com.bosch.iot.suite.examples.geolocation:Geolocation:1.0.0" ],
         "properties":{
            "geoposition":{
               "latitude":47.68,
               "longitude":9.3865
            },
            "accuracy":15
         }
      },
      "orientation":{
         "properties":{
            "x":30,
            "y":20,
            "z":147
         }
      }
   }
}
```

# Update Position of Herbie

Use our [http API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/Features/put_things__thingId__features__featureId__properties__propertyPath_) to update your thing.\
You can update one entry of the geoposition or both.

featureId: geolocation

propertyPath: features/geolocation/properties/geoposition/latitude
```
47.665
```

propertyPath: features/geolocation/properties/geoposition
```
{
  "latitude": 47.68,
  "longitude": 9.3865
}
```

After you updated your thing, refresh your Inventory Browser and look how the arrow moved.

# More example Things

See [testdata.json](testdata.json) for more example things to create.

# License

See the iot-things-examples top level README.md file for license details.
