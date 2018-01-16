# Bosch IoT Things - Device integration with Bosch IoT Hub

This example shows how integrate device telemetry data into things of Bosch IoT Things using the device conncectivity of Bosch IoT Hub.
It shows how to register things/devices at Things/Hub and how to send data using either HTTP or MQTT.

## Use an existing or request a new Bosch IoT Things service instance

<a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking">Book the Bosch IoT Things cloud service</a>

## Use an existing or request a new Bosch IoT Hub tenant

Use the Sandbox of Bosch IoT Hub or request your own evaluation tenant. See [http://docs.bosch-iot-hub.com/] for details.

## Configure your settings

Set your credentials in the file "src/index.ts"

## Usage

```
npm install
npm run build
npm run start
```

If you need to access the Internet using a Proxy configuration, please make sure to set the environment variable HTTPS_PROXY.
For MQTT connectivity proxy configuration is NOT supported!

## License
See the iot-things-examples top level README.md file for license details.
