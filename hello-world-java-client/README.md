# Bosch IoT Things - Java client example

This example shows how to create and use the Java Integration Client for managing your first Hello World Thing.

Find detailed instructions in our <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=007-tutorial:client:02_device-int">tutorial</a>.

## Prerequisites

Book the service, create a private/public key pair for your solution, and submit the pubic key as described at <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:manage-solution-ui">Manage your Solution</a>. 

Add the CRClient.jks to the folder "src/main/resources".

## Configure your Settings

Adjust "src/main/java/.../HelloWorld.java" to your needs.
The placeholders are pre-defined at the top of class.


## Usage
Run the HelloWorld main class to create and update a thing:

    mvn exec:java -Dexec.mainClass="com.bosch.cr.integration.helloworld.HelloWorld"


## License
See the iot-things-examples top level README.md file for license details.
