# Bosch IoT Things - Things REST Angular (Example UI)

Implements a simple web application with angular.js and bootstrap to show how to use the Bosch IoT Things REST API with JavaScript.

The application can be deployed easily in CloudFoundry via the provided manifest. 

To avoid CORS(Cross-Origin resource sharing) issues, the nginx configuration will use reverse proxy to redirect rest calls.

```
location /cr {
	proxy_pass https://cr.apps.bosch-iot-cloud.com/cr;
}
```

## Deployment

To deploy the application to CloudFoundry, do the following.

* Build the project with maven ```mvn clean package```.
    
* Execute the following commands from a shell in the target folder.
    * ```cf login``` to configure your CloudFoundry login
    * ```cf push``` to deploy the application
    
## Demo

Give it a try [here](https://demos.apps.bosch-iot-cloud.com/things-rest-angular/)

## License

See the cr-examples top level README.md file for license details.