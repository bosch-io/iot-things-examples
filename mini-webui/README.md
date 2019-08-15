# Bosch IoT Things - Minimal Web UI

This example shows how to create a simple user interface to list a thing.
Find detailed instructions in our [tutorial](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_tutorial:java_client:web_business-view).

# Prerequisites

The following background knowledge is required for this example

- Maven
- Java
- JavaScript
- HTTP

## Configure your settings

In case your company requires a proxy add such settings
in a file "src/main/resources/config.properties"
```
## Your Things Service Endpoint URL. Can be found in your Credentials. 
## Use the same Endpoint as in your mini-device-integration example
endpoint_http=https://things.xxxxxxxx.com

## If needed use your company proxy settings
proxyHost=xxxxx
proxyPort=xxxxx
#proxyUser=xxxxx
#proxyPwd=xxxxx
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

Browse to the example web app: <http://localhost:8080/mini-webui/>\
Set your API token and the ID of the thing to be queried.\
Then click "Submit" and authenticate with a user which has at least read access to the things-feature.

## License
See the iot-things-examples top level README.md file for license details.
