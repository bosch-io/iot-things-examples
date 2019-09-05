# Examples for the Bosch IoT Things cloud service

**Table of contents**

- [Foreword](#foreword)
- [Examples](#examples)
    - [End2End](#end2end)
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
- [Preparation for the Bosch IoT Things - Things Client](#Preparation-for-the-Bosch-IoT-Things-\--Things-Client)
    - [Maven Repository](#Maven-Repository)
    - [Maven Dependency](#Maven-Dependency)
- [License](#License)

## Foreword

This repository contains examples for using the Bosch IoT Things service in the cloud.

Bosch IoT Things is part of the [Bosch IoT Suite](https://www.bosch-iot-suite.com) which is the cloud-based IoT platform provided by Bosch Software Innovations, as part of the Bosch Group.
Further background information regarding the platform is also available at the [Bosch Software Innovations](https://www.bosch-si.com/corporate/home/homepage.html) site.

The example code provided here shows a selection of the Bosch IoT Things service functionality. However, the examples do not cover the complete service offering. If you need more information, please visit the links above or contact us.

The examples are thematically according to the following topics:
- End2End
- Application related
- Device related

## Examples

### End2End

#### [digitaltwin-example](digitaltwin-example/)

This example shows a simple Node.js based end-to-end scenario for Digital Twins based on Bosch IoT Things / Eclipse Ditto.

#### [desired-state-synchronizer](desired-state-synchronizer/)

This example shows a simple Node.js based implementation and usage scenario for an integration of IoT devices with Bosch IoT Things / Eclipse Ditto that is based on distinguishing between the current reported state of device information and a desired, target state for that device. This is mainly required for configuration parameters of devices that are connected either sporadically or unstably.

#### [octopus-bidirectional](octopus-bidirectional/)

This example shows how to connect an ESP8266 based IoT board via Bosch IoT Hub to Bosch IoT Things in order to 
* update a digital twin via "telemetry" data sent from the device
* send command&control messages via Bosch IoT Things' HTTP API via Bosch IoT Hub to the device

#### [octopus-telemetry](octopus-telemetry/)

This example shows how to connect an ESP8266 based IoT board via Bosch IoT Hub to Bosch IoT Things in order to update 
a digital twin via "telemetry" data sent from the device.


### Application related

#### [inventory-browser](inventory-browser/)

This example shows how to create a simple HTML/JavaScript user interface to list things and their details. Additionally, the inventory browser can show the things on a map, given that the thing provides “geolocation” information.

The inventory browser integrates the "device-simulator" and "historian" features.

Find the deployed version in our demo section: https://demos.s-apps.de1.bosch-iot-cloud.com/

#### [historian](historian/)

This Java-based example shows how to collect and use historic data. While the Bosch IoT Things service keeps track of the latest property values of your things, this add-on helps to store old values in a MongoDB.
Further, is shows, how to make your historic data accessible for REST-like requests, and how to display such data in a time series chart.

#### [historian-influxdb](historian-influxdb/)

This Node.js based example shows how to collect historic data in a InfluxDB time series database and how to provide an query functionality integrated in the API of your Things.

#### [things-batch-importer](things-batch-importer/)

With this tool it is possible to upload multiple things stored in a file. This example is using the things client for uploading the things.

#### [things-client-examples](things-client-examples/)

This example shows how to use the Things Client for Java.

#### [things-http-java-examples](things-http-java-examples/)

This example shows how to use the HTTP API within Java using the Signature Authentication.

#### [http-forwarder](http-forwarder/)

This example shows a simple HTTP forwarder service implementation that pushes modifications of Things - managed with Bosch IoT Things - to an extern HTTP endpoint.

### Device related

#### [hub-device-integration](hub-device-integration/)

This example shows how integrate device telemetry data into things, of Bosch IoT Things, using the device connectivity of Bosch IoT Hub.

#### [mini-device-integration](mini-device-integration/)

This example shows how to create a minimal Java-based device integration application with our Things Client for Java.

#### [device-simulator](device-simulator/)

This example implements a simple HTML/JavaScript web application which simulates a simple device. It mimics a mobile phone/tablet to send data to the Things cloud service.


## Preparation for the Bosch IoT Things - Things Client

### Maven Repository

Some examples uses the [Bosch IoT Things - Things Client](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=dev_guide:java_api:start). In order to be able to run the examples you should add following Maven-Repository to your Maven `settings.xml`.

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

After adding the public repository as described above, you can simply use the [Bosch IoT Things - Things Client](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=dev_guide:java_api:start) dependency to your `pom.xml`:

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
