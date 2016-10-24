# Examples for the Bosch IoT Things cloud service

[![Join the chat at https://gitter.im/bsinno/cr-examples](https://badges.gitter.im/bsinno/cr-examples.svg)](https://gitter.im/bsinno/cr-examples?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This repository contains examples for using the Bosch IoT Things in the cloud.

## Preparation for Java Developers

### Maven Repository

In order to be able to run the examples (or to implement your own), you need the "Bosch IoT Things - Integration Client".
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

### Maven Depedency

After adding the public repository as described above, you can simply use the CRIC dependency to your `pom.xml`:

```
<dependency>
   <groupId>com.bosch.cr</groupId>
   <artifactId>cr-integration-client</artifactId>
   <version>2.4.0</version>
</dependency>
```

We also provide an OSGi-bundle:

```
<dependency>
   <groupId>com.bosch.cr</groupId>
   <artifactId>cr-integration-client-osgi</artifactId>
   <version>2.4.0</version>
</dependency>
```


Afterwards, inspire yourself by looking at the Examples:

## Examples

### Example "inventory-browser"

This example shows how to create a simple user interface to list things and their details and show the things on a map.

### Example "postman-collection"

This is a list of prepared REST call examples to demonstrate typical usages of the REST APIs.

The provided files can be used in Google Chrome browser extension "Postman". This extension can be downloaded here: <https://www.getpostman.com/>

### Example "integration-api-examples"

This example shows how to use the CR-Integration Client for Java.

### Example "things-rest-angular""

Implements a simple web application with angular.js and bootstrap to show how to use the Bosch IoT Things REST API with JavaScript.

## License

The examples are made available under the terms of Bosch SI Example Code License. See individual files for details.

As an exception the file "iframeResizer.contentWindow.min.js" is made available under the terms of the MIT License.
