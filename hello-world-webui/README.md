# Bosch IoT Things - Hello World Web UI

This example shows how to create a simple user interface to list your first Hello World Thing.
For detailed instructions see: <a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:tutorial:001_hello_world">here</a>

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

Use the following maven command to build the server:
```
mvn clean install
```

## Run Server

Use the following command to run the server.
```
java -jar target/hello-world-webui.jar
```

## Usage

### Show Dashboard

Browse to the Bosch IoT Things Dashboard: <https://things.apps.bosch-iot-cloud.com/>

### Create a Solution

Use the dashboard to create a solution.

### Create Demo User

Use the dashboard to create a demo user.

### Show Hello World UI

Browse to the example web app: <http://localhost:8080/hello-world-webui/>

### Create Thing over REST

In REST Documentation (Swagger): <https://cr.apps.bosch-iot-cloud.com/documentation/rest/>
use "Things - POST/things"

thing: 
```
{}
```
x-cr-api-token: "your-api-token"

Look in the response for the created Thing. Within this you will find your user's unique id which can be used in the next steps.
And the ID for the created Thing.

### Update Thing over REST

In REST Documentation (Swagger): <https://cr.apps.bosch-iot-cloud.com/documentation/rest/>
use "Things - PUT /things/{thingId}"

thingId: "your-thing-id"

thing:
```
{
        "acl": {
            "userId": {
                "READ": true,
                "WRITE": true,
                 "ADMINISTRATE": true
            },
            "solutionId": {
                "READ": true,
                "WRITE": true,
                "ADMINISTRATE": true
           }
}
```

x-cr-api-token: "your-api-token"

### Show Hello World UI

Browse to the example web app: <http://localhost:8080/hello-world-webui/>
Insert your Thing ID and Solution API Token and press Submit. 

### Update Hello World Thing with the Java Client

Use the Java Client and the Hello World Project to update the Attribute of the Hello World Thing.

### Refresh Hello World UI

Now you should see the Hello World Thing and the details. If you activate the auto refresh you can see live the counter attribute increasing the value.

## License

See the cr-examples top level README.md file for license details.