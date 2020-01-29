# Bosch IoT Things - REST examples - Deprecated

This example shows how to connect to Bosch IoT Things with the Signature Authentication (CRS).
The CRS Authentication allows (technical) clients to connect with a signature instead of BASIC Authentication. 
More information could be found at [authenticate as a client](https://docs.bosch-iot-suite.com/things/dev-guide/http-api/authenticate_as_a_client/). 
Find general information on the various authentication processes in our [basic concepts](https://docs.bosch-iot-suite.com/things/basic-concepts/auth/).\
To get familiar with our HTTP API you can take a look at our [REST documentation (Swagger)](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/).

**Note:** The deprecated authentication via PublicKey is part of this CRS Authentication.

## Knowledge prerequisites

To understand this example, knowledge of following is required:
- HTTP 
- Public-key cryptography 
- Java

## Preperation

Book the Bosch IoT Things cloud service as described in our [documentation](https://docs.bosch-iot-suite.com/things/getting-started/booking/). Follow the guide to manage your [namespace](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-namespace/) and [key-pair](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-key/).

## Configure

Create or adjust file `src/main/resources/config.properties`. You can use `src/main/resources/config-template.properties` as a template.

## Build and run

Build and run the example with the following command:
```
mvn compile exec:java
```

## License

See the iot-things-examples top level README.md file for license details.
