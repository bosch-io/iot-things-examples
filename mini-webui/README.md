# Bosch IoT Things - Minimal Web UI

This example shows how to create a simple user interface to list your first Hello World Thing.

Find detailed instructions in our <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=007-tutorial:client:03_business-view">tutorial</a>.

## Configure your proxy host if needed

Create or adjust file "src/main/resources/config.properties"

```
thingsServiceEndpointUrl=https://things.apps.bosch-iot-cloud.com
http.proxyHost=### your http proxy host, if you need one ###
http.proxyPort=### your http proxy port, if you need one ###
http.proxyUser=### your http proxy user, if you need one ###
http.proxyPwd=### your http proxy pwd, if you need one ###
```

## Build

Use the following Maven command to build the server:

    mvn clean install


## Run Server

Use the following command to run the server.

    java -jar target/hello-world-webui.jar


## Usage

Find detailed instructions in our <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=007-tutorial:client:03_business-view">tutorial</a>.

### Show Hello World UI

Browse to the example web app: <http://localhost:8080/hello-world-webui/>
Insert your Thing ID and Solution API Token and press Submit. 

### Update Hello World Thing with the Java Client

Use the Java Client and the mini-device-integration project to update the Attribute of the Hello World Thing.

### Refresh Hello World UI

Now you should see the Hello World Thing and the details. If you activate the auto refresh you can see live the counter attribute increasing the value.

## License

See the iot-things-examples top level README.md file for license details.