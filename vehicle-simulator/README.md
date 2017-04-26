# Bosch IoT Things - Example Vehicle Simulator

This example shows how to integrate devices information using Java with Bosch IoT Things.

# Build

```
mvn clean install
```

# Create a Solution with a private/public key

<a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking">Book the Bosch IoT Things cloud service</a>


# Create a User

Register your user on [things.apps.bosch-iot-cloud.com](https://things.apps.bosch-iot-cloud.com) and save the id for further usage.

# Add CRClient.jks

Add the CRClient.jks to your project root folder.
If you don't have such a file go back to #Create a Solution with a private/public key.

# Configure your Client Id and other settings

Create file "config.properties" in your project root folder. _Please change the ids._


```
clientId=###your solution id ###:gateway
apiToken=###your solution API token###
defaultNamespace=###the default namespace of your solution###
keyAlias=CR
keyStorePassword=### your key password ###
keyAliasPassword=### your key alias password ###
http.proxyHost=### your http proxy host, if you need one ###
http.proxyPort=### your http proxy host, if you need one ###
```


# Run it

Use the following command to run the example.

```
mvn exec:java -Dexec.mainClass="com.bosch.cr.examples.carintegrator.VehicleSimulator"
```

# Create Thing

Create a Thing with the inventory-browser acl and your solution id acl and your geolocation.

```
{
   "acl": {
      "###your user id###": {
         "READ": true,
         "WRITE": true,
         "ADMINISTRATE": true
      },
      "###your solution id ###:gateway": {
         "READ": true,
         "WRITE": true,
         "ADMINISTRATE": true
      }
   },
   "features": {
      "geolocation": {
         "properties": {
            "geoposition": {
               "latitude": 47.68353,
               "longitude": 9.388532
            }
         }
      }
   }
}
```

# Usage

Login to the [Inventory Browser](http://demos.apps.bosch-iot-cloud.com/inventory-browser/) with your created User and see your vehicle(s) move.


# License

See the iot-things-examples top level README.md file for license details.
