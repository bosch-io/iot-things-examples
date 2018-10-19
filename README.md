# Examples for the Bosch IoT Things cloud service

This repository contains examples for using the Bosch IoT Things service in the cloud.

Bosch IoT Things is part of the [Bosch IoT Suite](https://www.bosch-iot-suite.com) which is the cloud-based IoT platform provided by Bosch Software Innovations, as part of the Bosch Group.
Further background information regarding the platform is also available at the [Bosch Software Innovations](https://www.bosch-si.com/iot-platform/bosch-iot-suite/homepage-bosch-iot-suite.html) site.

## Examples

The example code provided here shows a selection of the Bosch IoT Things service functionality. However, the examples do not cover the complete service offering. If you need more information, please visit the links above or contact us.

### Example "inventory-browser"

This example shows how to create a simple HTML/JavaScript user interface to list things and their details. Additionally, the inventory browser can show the things on a map, given that the thing provides “geolocation” information.

The inventory browser integrates the "device-simulator" and "historian" features.

Find the deployed version in our demo section: https://demos.s-apps.de1.bosch-iot-cloud.com/

### Example "device-simulator"

This example implements a simple HTML/JavaScript web application which simulates a simple device. It mimics a mobile phone/tablet to send data to the Things cloud service.

### Example "historian"

This Java-based example shows how to collect and use historic data. While the Bosch IoT Things service keeps track of the latest property values of your things, this add-on helps to store old values in a MongoDB.
Further, is shows, how to make your historic data accessible for REST-like requests, and how to display such data in a time series chart.

### Example "historian-influxdb"

This Node.js based example shows how to collect historic data in a InfluxDB time series database and how to provide an query functionality integrated in the API of your Things.

### Example "digitaltwin-example"

This example shows a simple Node.js based end-to-end scenario for Digital Twins based on Bosch IoT Things / Eclipse Ditto.

### Example "desired-state-synchronizer"

This example shows a simple Node.js based implementation and usage scenario for an integration of IoT devices with Bosch IoT Things / Eclipse Ditto that is based on distinguishing between the current reported state of device information and a desired, target state for that device. This is mainly required for configuration parameters of devices that are connected either sporadically or unstably.

### Example "postman-collection"

This is a list of prepared HTTP requests to demonstrate the typical usage of our REST-like HTTP APIs.

Download the Google Chrome browser extension "Postman": <https://www.getpostman.com/>.
Then you can import this example. It contains several collections of HTTP requests, along with environment configuration files, which help your easy adapt the requested URL to our development or productive space.

Additional to the prepared requests you will need valid user credentials and an API token.

### Example "things-client-examples"

This example shows how to use the Things Client for Java.

### Example "things-http-java-examples"

This example shows how to use the HTTP API within Java using the Signature Authentication.

### Example "openid-jwt-login"

This example creates a web application with a login dialog. Upon successful authentication a JSON Web Tokens (JWT) is issued by one of the identity providers integrated with the Things service. The web application then displays all things on which the specific user was granted read permission.

### Example "openid-browser-automation"

Use this example in case you need to work with a OpenId Connect JWT token issued by Bosch-ID. The application mimics a browser-based login, for a Bosch account. PROVIDED ONLY AS EXAMPLE FOR DEVELOPMENT - DO NOT USE IN PRODUCTION!

### Example "mini-device-integration"

This example shows how to create a minimal Java-based device integration application with our Things Client for Java.

### Example "mini-webui"

Learn how to create your own to HTML/JavaScript UI to display the _Thing_ generated via our Java client, with the "mini-device-integration" example.

## Preparation for Java Developers

### Maven Repository

In order to be able to run the examples (or to implement your own), you need the "Bosch IoT Things - Things Client".
This is available via our public Maven repository. Add following Maven-Repository to your Maven `settings.xml`:

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

After adding the public repository as described above, you can simply use the Things Client dependency to your `pom.xml`:

```
<dependency>
   <groupId>com.bosch.iot.things.client</groupId>
   <artifactId>things-client</artifactId>
   <version>3.2.0</version>
</dependency>
```

We also provide an OSGi-bundle:

```
<dependency>
   <groupId>com.bosch.iot.things.client</groupId>
      <artifactId>things-client-osgi</artifactId>
   <version>3.2.0</version>
</dependency>
```
## License

The examples are made available under the terms of Bosch SI Example Code License. See individual files for details.
