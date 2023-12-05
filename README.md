# Examples for Bosch IoT Things

This repository contains examples for using Bosch IoT Things.
It is part of the [Bosch IoT Suite](https://www.bosch-iot-suite.com) which is the cloud-based IoT platform provided by [Bosch.IO](https://bosch.io/).
The service is *based on* and *powered by* the open source project [Eclipse Ditto](https://www.eclipse.org/ditto/).

The provided example code offers a glimpse into the functionality of the Bosch IoT Things service, showcasing a subset of its features. It's important to note that these examples do not encompass the entirety of the service offering.

For additional information, kindly refer to the provided links or feel free to reach out to us.

## [digitaltwin-example](digitaltwin-example/)

This concept illustrates a comprehensive end-to-end scenario for digital twins utilizing Bosch IoT Things / Eclipse Ditto.

## [desired-state-synchronizer](desired-state-synchronizer/)

This example demonstrates a usage scenario for integrating IoT devices with Bosch IoT Things / Eclipse Ditto. The emphasis is on distinguishing between the presently reported state of device information and a desired target state. This distinction is particularly crucial for configuration parameters of devices that are intermittently or unreliably connected.

## [octopus-firmware](octopus-firmware/)

This example illustrates the process of connecting an ESP8266-based IoT board to Bosch IoT Hub, subsequently linking it to Bosch IoT Things. It further demonstrates how to update a digital twin through the transmission of "telemetry" data sent from the device.

## [octopus-simulator](octopus-simulator/)

This example is a local Node.js simulator which you can use as a replacement for [octopus-firmware](octopus-firmware/)
if you don't have access to an Octopus.

## [octopus-frontend](octopus-frontend/)

This example demonstrates the procedure for dispatching command-and-control messages through the HTTP API of Bosch IoT Things to Bosch IoT Hub and, subsequently, to the physical device.

## [things-batch-importer](things-batch-importer/)

Utilizing this tool enables the simultaneous upload of a substantial number of things into your cloud service instance. The provided example employs the things-client for uploading the things from a local file.

## License

The examples are made accessible under the terms of the Bosch SI or Bosch.IO Example Code License. Please refer to individual files for specific details.
