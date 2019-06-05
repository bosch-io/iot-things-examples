# Bosch IoT Things Client examples

These example shows how to use the Things Client to manage Things, Attributes and Features, register for changes on your Things, send messages.
You can find more information about the Things Client at our [Wiki](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=dev_guide:java_api:start).
Instructions how to generate the required keystore are available in our [Getting started](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:manage-key) guide. 

## Configure

Create or adjust the file `src/main/resources/config.properties`. 

## Build and run

Build and run an Example (e.g. `RegisterForChanges`) with the following command:
```
mvn compile exec:java -Dexec.mainClass="com.bosch.iot.things.examples.changes.RegisterForChanges"
```

## License

See the iot-things-examples top level README.md file for license details.
