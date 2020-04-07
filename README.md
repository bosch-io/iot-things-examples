# Examples for the Bosch IoT Things cloud service

**Table of contents**

- [About Things](#about-things)
- [Examples](#examples)
    - [End-to-end](#end-to-end)
        - [digitaltwin-example](#digitaltwin-example)
        - [desired-state-synchronizer](#desired-state-synchronizer)
        - [octopus-bidirectional](#octopus-bidirectional)
        - [octopus-telemetry](#octopus-telemetry)
    - [Application related](#Application-related)
        - [inventory-browser](#inventory-browser)
        - [historian](#historian)
        - [historian-influxdb](#historian-influxdb)
        - [things-batch-importer](#things-batch-importer)
        - [things-client-examples](#things-client-examples)
        - [things-http-java-examples](#things-http-java-examples)
        - [http-forwarder](#http-forwarder)
    - [Device related](#Device-related)
        - [hub-device-integration](#hub-device-integration)
        - [mini-device-integration](#mini-device-integration)
        - [device-simulator](#device-simulator)
- [Setup your workspace to work with the things-client](#Setup-your-workspace-to-work-with-the-things\-client)
    - [Maven Repository](#Maven-Repository)
    - [Maven Dependency](#Maven-Dependency)
- [License](#License)

## About Things

This repository contains examples for using the Bosch IoT Things service in the cloud.

Bosch IoT Things is part of the [Bosch IoT Suite](https://www.bosch-iot-suite.com) which is the cloud-based IoT platform provided by [Bosch.IO](https://bosch.io) GmbH.

The Things service is *based on* and *powered by* the open source project Eclipse Ditto https://www.eclipse.org/ditto/.

The example code provided here shows a *selection* of the Bosch IoT Things service functionality. Thus, the examples do not cover the complete service offering. 

If you need more information, please visit the links above or contact us.

The examples are structured in following groups:
- End-to-end
- Application related
- Device related

## Examples

### End-to-end

#### [digitaltwin-example](digitaltwin-example/)

This example shows a simple Node.js based end-to-end scenario for digital twins based on Bosch IoT Things / Eclipse Ditto.

#### [desired-state-synchronizer](desired-state-synchronizer/)

This example shows a simple Node.js based implementation and usage scenario for an integration of IoT devices with Bosch IoT Things / Eclipse Ditto. It is focused on distinguishing between the _current_ reported state of device information and a _desired_, target state for that device. This is mainly required for configuration parameters of devices that are connected either sporadically or unstably.

#### [octopus-bidirectional](octopus-bidirectional/)

This example shows how to connect an ESP8266 based IoT board via _Bosch IoT Hub_ to _Bosch IoT Things_.

It shows how to 
* update a digital twin via "telemetry" data sent from the device
* send command-and-control messages via the HTTP API of _Bosch IoT Things_ to _Bosch IoT Hub_ to the physical device - and back

#### [octopus-telemetry](octopus-telemetry/)

This example shows how to connect an ESP8266 based IoT board via _Bosch IoT Hub_ to _Bosch IoT Things_ in order to update 
a digital twin via "telemetry" data sent from the device.


### Application related

#### [inventory-browser](inventory-browser/)

This example shows how to create a simple UI (with HTML/JavaScript) to list things and their details. Additionally, the inventory browser can show the things on a map, given that the thing provides “geolocation” information.

The inventory browser integrates the "device-simulator" and "historian" features.

Find the deployed version in our demo section: https://demos.s-apps.de1.bosch-iot-cloud.com/

#### [historian](historian/)

This Java-based example shows how to collect and use historic data. 

While the Bosch IoT Things service keeps track of the _latest_ property values of your things, this add-on helps to _store old values_ in a MongoDB.
Further, is shows, how to make your historic data accessible for HTTP requests, and how to display such data in a time series chart.

#### [historian-influxdb](historian-influxdb/)

This Node.js based example shows how to collect historic data in an InfluxDB time series database, and how to provide query functionality integrated in the API of your things.

#### [things-batch-importer](things-batch-importer/)

With this tool, you can upload a large number things into your cloud service instance at once. The example uses the things-client for uploading the things from a local file.

#### [things-http-java-examples](things-http-java-examples/)

This example shows how to use the HTTP API within Java using the Signature Authentication.

#### [http-forwarder](http-forwarder/)

This example shows a simple implementation of an HTTP forwarder service. It pushes modifications of things - managed with your service instance - to an external HTTP endpoint.

### Device related

#### [hub-device-integration](hub-device-integration/)

This example shows how to integrate device telemetry data into things. Bosch IoT Things uses the device connectivity functionality provided by Bosch IoT Hub - another cloud service of the Bosch IoT Suite.

#### [mini-device-integration](mini-device-integration/)

This example shows how to create a minimal device integration application in Java. It uses our things-client.

#### [device-simulator](device-simulator/)

This example implements a simple Web application which simulates a device. It mimics a mobile phone/tablet to send data to the Things service.


## Setup your workspace to work with the things-client

### Maven Repository

Some examples use the [Bosch IoT Things - Things Client](https://docs.bosch-iot-suite.com/things/dev-guide/java-api/). In order to be able to run the examples you will need to add our repository to your Maven `settings.xml`.

```
   ..
   <repositories>
      <repository>
         <id>bosch-releases</id>
         <url>https://maven.bosch-si.com/content/repositories/bosch-releases/</url>
         <releases>
            <enabled>true</enabled>
            <updatePolicy>never</updatePolicy>
         </releases>
         <snapshots>
            <enabled>false</enabled>
            <updatePolicy>daily</updatePolicy>
         </snapshots>
      </repository>
      ..
   </repositories>
   ..
```

### Maven Dependency

After adding the public repository as described above, you can simply use the [Bosch IoT Things - Things Client](https://docs.bosch-iot-suite.com/things/dev-guide/java-api/) dependency to your `pom.xml`:

```
<dependency>
   <groupId>com.bosch.iot.things.client</groupId>
   <artifactId>things-client</artifactId>
   <version>4.0.0</version>
</dependency>
```

We also provide an OSGi-bundle:

```
<dependency>
   <groupId>com.bosch.iot.things.client</groupId>
   <artifactId>things-client-osgi</artifactId>
   <version>4.0.0</version>
</dependency>
```
## License

The examples are made available under the terms of Bosch SI Example Code License. See individual files for details.
