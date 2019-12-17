# Bosch IoT Things Client examples

These example show how to use the Things Client to manage Things, Attributes/Features, register for changes on your Things and send messages.
You can find more information about the Things Client in our [developer guide](https://docs-staging.bosch-iot-suite.com/things/dev-guide/java-api/).

## Prerequisites

The following background knowledge is required for this example
- Java
- Maven
- Asymmetric cryptography
- Publish–subscribe pattern

## Preperation

Book the Bosch IoT Things cloud service as described in our [documentation](https://docs.bosch-iot-suite.com/things/getting-started/booking/). Follow the guide to manage your namespace and key-pair.\
Book the Bosch IoT Permission cloud service and register two users as described [in our demo](https://docs.bosch-iot-suite.com/things/examples-demo/createuser/).


## Configure

Create or adjust the file `src/main/resources/config.properties`. You can use `src/main/resources/config-template.properties` as a template.



## Build and run

Build and run an example (e.g. `RegisterForChanges`) with the following command:
```
mvn compile exec:java -Dexec.mainClass="com.bosch.iot.things.examples.changes.RegisterForChanges"
```


## License

See the iot-things-examples top level README.md file for license details.
