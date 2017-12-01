# Bosch IoT Things - Minimal device integration example

This example shows how to create and use the Things Client for managing your first Hello World Thing.
For detailed instructions see: <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:tutorial:000_hello_world">here</a>

## Create a Solution with a private/public key

<a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking">Book the Bosch IoT Things cloud service</a>

Add the ThingsClient.jks to the folder `src/main/resources`.

## Configure your settings

Set your IDs and keystore passwords in the file "src/main/resources/config.properties"

## Usage
Run the DeviceIntegration main class to create and update a thing:
```
mvn exec:java
```

## License
See the iot-things-examples top level README.md file for license details.
