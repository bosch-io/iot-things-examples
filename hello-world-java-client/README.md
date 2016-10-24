# Bosch IoT Things - Hello World Example

This example shows how to create and use the Java Integration Client for managing your first Hello World Thing.
For detailed instructions see: <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:tutorial:000_hello_world">here</a>

## Create a Solution with a private/public key

https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:cr_02_booking-cr-service.txt

Add the CRClient.jks to the folder "src/main/resources".

## Configure your Settings

Set your IDs and keystore passwords in the file "src/main/java/.../HelloWorld.java"
```
public static final String SOLUTION_ID = <your-solution-id>;
public static final String USER_ID = "<your-user-id>";
public static final String KEYSTORE_PASSWORD = "<your-keystore-password>";
public static final String ALIAS_PASSWORD = "<your-alias-password>";
```

## Usage
Run the HelloWorld main class to create and update a thing:

```
mvn exec:java -Dexec.mainClass="com.bosch.cr.integration.helloworld.HelloWorld"
```

## License
See the cr-examples top level README.md file for license details.
