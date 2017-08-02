# Examples for the Bosch IoT Things cloud service

This repository contains examples for using the Bosch IoT Things in the cloud.

The Bosch IoT Things service is part of the Bosch IoT Suite which is the cloud-based IoT platform provided by Bosch Software Innovations as part of the Bosch Group.

Background information can be found here:
- [Bosch IoT Things](https://www.bosch-iot-suite.com/things/)
- [Bosch IoT Suite](https://www.bosch-iot-suite.com/)
- More [news/background about the Bosch IoT Suite](https://www.bosch-si.com/iot-platform/bosch-iot-suite/homepage-bosch-iot-suite.html)

## Examples

Inspire yourself for using the Bosch IoT Things service by looking at the following Examples.

The examples currently on cover some selected aspects of the functionality and do not provide a full overview of the possibilites. If you want to learn more please look at the provided background information or get in contact with us.

### Example "inventory-browser"

This example shows how to create a simple user interface to list things and their details and show the things on a map.

### Example "postman-collection"

This is a list of prepared REST call examples to demonstrate typical usages of the REST APIs.

The provided files can be used in Google Chrome browser extension "Postman". This extension can be downloaded here: <https://www.getpostman.com/>

### Example "cr-integration-api-examples"

This example shows how to use the CR-Integration Client for Java. The CR-Integration Client for Java will be replaced by the upcoming Things Client for Java.

### Example "things-client-examples"

This example shows how to use the upcoming of the Things Client for Java. The Things Client for Java is currently a release candidate.

### Example "things-rest-angular""

Implements a simple web application with angular.js and bootstrap to show how to use the Bosch IoT Things REST API with JavaScript.

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
   <groupId>com.bosch.iot.things</groupId>
   <artifactId>things-client</artifactId>
   <version>3.0.0.RC9</version>
</dependency>
```

We also provide an OSGi-bundle:

```
<dependency>
   <groupId>com.bosch.iot.things</groupId>
      <artifactId>things-client-osgi</artifactId>
   <version>3.0.0.RC9</version>
</dependency>
```


Afterwards, inspire yourself by looking at the Examples:

## Examples

### Example "inventory-browser"

This example shows how to create a simple user interface to list things and their details and show the things on a map.

### Example "postman-collection"

This is a list of prepared REST call examples to demonstrate typical usages of the REST APIs.

The provided files can be used in Google Chrome browser extension "Postman". This extension can be downloaded here: <https://www.getpostman.com/>

### Example "things-client-examples"

This example shows how to use the CR-Integration Client for Java.

### Example "things-rest-angular""

Implements a simple web application with angular.js and bootstrap to show how to use the Bosch IoT Things REST API with JavaScript.

## License

The examples are made available under the terms of Bosch SI Example Code License. See individual files for details.

As an exception the file "iframeResizer.contentWindow.min.js" is made available under the terms of the MIT License.
