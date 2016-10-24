# Bosch IoT Things - Device Simulator

Implements a simple web application to simulate a device by using a sensor information of a modern mobile phone/tablet. 
The application listens for geolocation and orientation events of the device and pushes the received data into Bosch IoT Things using the REST API.
It is integrated in the Inventory Browser example using a QR Code to transport the URL including the Thing Id of the simulated device.

## Configuration

You have to prepare the folling information:

API-Token: your Things solution API Token to execute API Calls
Technical-User: a technical user (e.g. registered in the Things dashboard). Use a BASE64 encoder (like http://www.tuxgraphics.org/toolbox/base64-javascript.html) to create a a snippet.  

## Deployment

To deploy the application to Cloud Foundry, execute the following commands:

* ```mvn clean package -Dapi.token=<api-token> -Dbasic.auth.base64=<technical-user-auth>``` to build the project with your <api-token> and <technical-user-auth> for the reverse proxy.
* ```cf login``` to configure your cloud foundry login.
* ```cd target``` followed by ```cf push``` to deploy the application.

## License

See the cr-examples top level README.md file for license details.