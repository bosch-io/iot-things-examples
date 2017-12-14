# Bosch IoT Things - REST examples

This example shows how to connect to Bosch IoT Things with the Signature Authentication (CRS).
The CRS Authentication allows (technical) clients to connect with a signature instead of BASIC auth.
You can find more information on the different authentication processes at our [Wiki](https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:004_rest_api:011_authenticate_as_a_client).
Instructions how to generate the required keystore are available in our [Getting started](https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:manage-solution-ui#private_and_public_key) guide. 

## Configure

Create or adjust file "config.properties"

```
thingsServiceEndpointUrl=https\://things.s-apps.de1.bosch-iot-cloud.com
clientId=### user solution id ###\:restcli
apiToken=### user solution API Token ###
namespace=### user solution namespace ###
keystoreLocation=ThingsClient.jks
keyAlias=Things
keyStorePassword=### your key password ###
keyAliasPassword=### your key alias password ###
#http.proxyHost=### your http proxy host, if you need one ###
#http.proxyPort=### your http proxy host, if you need one ###
#http.proxyPrincipal=### your http proxy principal (user), if you need one ###
#http.proxyPassword=### your http proxy password, if you need one ###
```

The `keystoreLocation` is a path relative to the path the example is run from.

## Build and run

Build and run the Example with the following command:
```
mvn compile exec:java
```

## License

See the iot-things-examples top level README.md file for license details.
