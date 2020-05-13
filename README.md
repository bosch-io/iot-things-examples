# Examples for the Bosch IoT Things cloud service

**Table of contents**

- [About Things](#about-things)
- [desired-state-synchronizer](#desired-state-synchronizer)
- [things-batch-importer](#things-batch-importer)
- [octopus-device-integration](#octopus-device-integration)
- [octopus-app](#octopus-app)
- [License](#License)

## About Things

This repository contains examples for using the Bosch IoT Things service in the cloud.

Bosch IoT Things is part of the [Bosch IoT Suite](https://www.bosch-iot-suite.com) which is the cloud-based IoT platform provided by [Bosch.IO](https://bosch.io/) GmbH.

The Things service is *based on* and *powered by* the open source project Eclipse Ditto https://www.eclipse.org/ditto/.

The example code provided here shows a *selection* of the Bosch IoT Things service functionality. Thus, the examples do not cover the complete service offering. 

If you need more information, please visit the links above or contact us.

## [digitaltwin-example](digitaltwin-example/)

This example shows an end-to-end scenario for digital twins based on Bosch IoT Things / Eclipse Ditto.

## [desired-state-synchronizer](desired-state-synchronizer/)

This example shows a usage scenario for an integration of IoT devices with Bosch IoT Things / Eclipse Ditto. It is focused on distinguishing between the _current_ reported state of device information and a _desired_, target state for that device. This is mainly required for configuration parameters of devices that are connected either sporadically or unstably.

## [octopus-device-integration](octopus-device-integration/)

This example shows how to connect an ESP8266 based IoT board via _Bosch IoT Hub_ to _Bosch IoT Things_ and how to update a digital twin via "telemetry" data sent from the device.

## [octopus-app](octopus-app/)

This example shows how to send command-and-control messages via the HTTP API of _Bosch IoT Things_ to _Bosch IoT Hub_ to the physical device.

## [things-batch-importer](things-batch-importer/)

With this tool, you can upload a large number things into your cloud service instance at once. The example uses the things-client for uploading the things from a local file.

## License

The examples are made available under the terms of Bosch SI Example Code License. See individual files for details.
