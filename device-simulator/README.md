# Bosch IoT Things - Device Simulator

Implements a simple web application to simulate a device by using a sensor information of a modern mobile phone/tablet. 
The application listens for geolocation and orientation events of the device and pushes the received data into Bosch IoT Things using the REST API.
It is integrated in the Inventory Browser example using a QR Code to transport the URL including the Thing Id of the simulated device.

## Prerequisites

The following background knowledge is required for this example
- Cloud Foundry
- Java Script
- Maven

## Preperation

Book the Bosch IoT Things cloud service as described in our [documentation](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:start). Follow the guide to manage your namespace and key-pair.\
Book the Bosch IoT Permission cloud service and a user as described [here](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_demo:createuser).\
This example is designed to run in Cloud Foundry. Therefore a Cloud Foundry instance must already exist. Also it build on top of the [inventory-browser example](https://github.com/bsinno/iot-things-examples/tree/master/inventory-browser). So an instance of it should already be deployed in Cloud Foundry.\
To connect to your Cloud Foundry instance download and install the [Cloud Foundry Command Line Interface (cf CLI)](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)

## Configuration

You have to prepare the following information:

API-Token: Your Things solution API Token to execute API Calls. You can find it in your things service credentials\
Technical-User: a permissions user (e.g. registered in the Things dashboard). Use a BASE64 encoder (like http://www.tuxgraphics.org/toolbox/base64-javascript.html) to create a snippet. Your input should follow this format: tenand\username:password\
In main.js of your [inventory-browser example](https://github.com/bsinno/iot-things-examples/tree/master/inventory-browser) you can change the route-URL for this example

## Deployment

To deploy the application to Cloud Foundry, execute the following commands:

* ```mvn clean package -Dapi.token=<API-Token> -Dbasic.auth.base64=<Technical-User>``` to build the project with your <API-Token> and <Technical-User> for the reverse proxy.
* ```cf login``` to configure your cloud foundry login.
* ```cd target``` followed by ```cf push``` to deploy the application.
* Set the route-URL for your example in Cloud Foundry 

## Usage

1) Start your inventory-browser example
2) Create a new thing over the "+ Create" button
3) Scan the QR-Code with your Smartphone

## License

See the iot-things-examples top level README.md file for license details.