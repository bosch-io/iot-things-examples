# Bosch IoT Things - Minimal Web UI

This example shows how to create a simple user interface to list a thing.
Find detailed instructions in our [tutorial](https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=007-tutorial:client:client).

## Configure your settings

In case your company requires a proxy add such settings
in a file "src/main/resources/config.properties"
```
## Use your company proxy settings
proxyHost=xxxx
proxyPort=xxxx
proxyPrincipal=xxxx
proxyPassword=xxx
```

## Build

Use the following maven command to build the server:
```
mvn clean install
```

## Run Server

Use the following command to run the server.
```
java -jar target/mini-webui.jar
```

### Show the UI

Browse to the example web app: <http://localhost:8080/mini-webui/>

Set your API token and the ID of the thing to be queried.

Then click Submit. 

## License
See the iot-things-examples top level README.md file for license details.