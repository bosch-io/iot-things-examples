# Bosch IoT Things - Minimal device integration example

This example shows how to create and use the Things Client for managing a thing entity. Find detailed instructions in our [tutorial](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_tutorial:java_client:start).

## Prerequisites

The following background knowledge is required for this example

- Maven
- Java
- Asymmetric Cryptography

## Configure your settings

Set your IDs and keystore passwords in the file "src/main/resources/config.properties". Find a [cheat sheet](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_tutorial:java_client:w_device-int#cheatsheet_config_properties) in our tutorial.\
An authentication using Public-key cryptography is not currently not used. If an authentication via Public-key cryptography is desired, this can be inserted quickly, since a template already exists in the source code.

## Usage
Run the 'DeviceIntegration' main class to create and update a thing:
```
mvn clean install
mvn exec:java
```

## License
See the iot-things-examples top level README.md file for license details.