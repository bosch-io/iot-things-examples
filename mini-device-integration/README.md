# Bosch IoT Things - Minimal device integration example

This example shows how to create and use the Things Client for managing a thing entity. Find detailed instructions in our [tutorial](https://docs.bosch-iot-suite.com/things/tutorials/java_client/).

## Prerequisites

The following background knowledge is required for this example

- Maven
- Java
- Asymmetric Cryptography

## Configure your settings

Set your IDs and keystore passwords in the file `src/main/resources/config.properties`. Find a [cheat sheet](https://docs.bosch-iot-suite.com/things/tutorials/java_client/w_device-int/#cheatsheet-config-properties) in our tutorial.\
An authentication using Public-key cryptography is currently not used. If an authentication via Public-key cryptography is desired, this can be inserted quickly, since a template already exists in the source code.

## Usage

Run the 'DeviceIntegration' main class to create and update a thing:
```
mvn clean install
mvn exec:java
```

You will see how a feature with the featureId "counter" will increment his value till 100 is reached. You can track the features grow either in your Terminal or you can use a front-end like described in our ["Octopus bidirectional"](https://github.com/bosch-io/iot-things-examples/tree/master/octopus-bidirectional) example.

## License

See the iot-things-examples top level README.md file for license details.
