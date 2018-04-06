# Bosch IoT Things - Device integration with Bosch IoT Hub

This example shows how integrate device telemetry data into things of Bosch IoT Things using the device connectivity of Bosch IoT Hub.
It shows how to register things/devices at Things/Hub and how to send data using either HTTP or MQTT.

## Use an existing or request a new Bosch IoT Things service instance

Book the Bosch IoT Things cloud service: as described in our [documentation](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking).

## Use an existing or request a new Bosch IoT Hub tenant

Request your own tenant for the Bosch IoT Hub (based on Eclipse Hono): see [Bosch IoT cloud service](https://www.bosch-iot-suite.com/hub/) for details.

After you have both instances (Things and Hub) in place, you can setup the integration between the two.
Find background information in our [documentation](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:006_message:007_protocol_bindings:amqp10_binding).

## Configure your settings

Set your credentials in the file "src/index.ts"

## Usage

```
npm install
npm run build
npm run start
```

If you need to access the Internet using a proxy configuration, please make sure to set the environment variable HTTPS_PROXY.
For MQTT connectivity proxy configuration is NOT supported!

## License
See the iot-things-examples top level README.md file for license details.
