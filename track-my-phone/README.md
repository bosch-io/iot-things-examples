# Bosch IoT Things - Track my Phone

Implements a simple web application to integrate a device with the Bosch IoT Things REST API in JavaScript.
The application listens for geolocation and orientation events of the device and pushes the received data into Bosch IoT Things.

## Configuration

The application will be hosted in Cloud Foundry using the staticfile buildpack. Deployment is preconfigured in the manifest.yml.

```
---
applications:
- name: track-my-phone
  memory: 16M
  disk_quota: 16M
  buildpack: https://github.com/cloudfoundry/staticfile-buildpack.git
  host: track-my-phone
  path: /dist
```

To avoid CORS(Cross-Origin resource sharing) issues, the nginx configuration will use a proxy to redirect the REST calls to the CR.

```
location /cr {
	proxy_pass https://things.apps.bosch-iot-cloud.com/api/1;
}
```

## Deployment

To deploy the application to Cloud Foundry, execute the following commands:

* ```mvn clean package -Dapi.token=<api-token>``` to build the project with your <api-token> for the reverse proxy.
* ```cf login``` to configure your cloud foundry login
* ```cf push target\manifest.yml``` to deploy the application

## License

See the cr-examples top level README.md file for license details.