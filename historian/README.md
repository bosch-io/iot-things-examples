# Bosch IoT Things - Example Data Historian

This example shows a simple historian service implementation that pushes modifications of Things, managed with Bosch IoT Things, to a MongoDB and  how to make them accessible via REST.

This example can be used as basis for custom historian implementations and visualizations (e.g. by using a Grafana dashboard) and it could also be included in a Digital Twin approach where history data is directly accessible within the Digital Twin API.

![Screenshot](screenshot.png)

## How it works?

### Overview

The following diagram shows how the Example Data Historian could work:

![Overview](overview.png)

Overview:

- Your (existing) IoT solution uses Bosch IoT Things to integrate it's devices
- This Historian application can run separately from your other applications
- Subscribes to all changes on the different Features of the managed Things
- All fetched changes are stored as a time series record in a MongoDB database
- The Historian application can be used by your business solution to access or to display history data of individual Thing properties


## Prerequisites

The following background knowledge is required for this example
- Mongo DB
- Java
- Maven
- Asymmetric cryptography
- HTTP

## MongoDB document layout

The time serias data is recorded in a simple document structure in MongoDB.

For each single (scalar) property of a Thing exactly one document is managed. This document has an unique id consisting of `<thing-id>/features/<feature-id>/properties/<property-path>`. Each document consists of two array fields: 
1) "values" array 
2) "timestamps" array

Both arrays are updated on every property change.\
The new value and timestamp is added to the end of the array. In addition the array is sliced, to not exceed a fixed element count.

| Document Id | Content |
| --- | --- |
| demo:vehicle-53/features/envscanner/properties/velocity | { "_id": ..., "values": [ 60.50, 62.94, 64.12, ... ], "timestamps: [ "2016-04-28T22:19:59.841Z", "2016-04-28T22:20:03.143Z", "2016-04-28T22:20:06.047Z", ... ] } |
| demo:vehicle-53/features/envscanner/properties/acceleration | { "_id": ..., "values": [ 2.21, 1.95, 1.59, ... ], "timestamps: [ "2016-04-28T22:19:59.841Z", "2016-04-28T22:20:03.143Z", "2016-04-28T22:20:06.047Z", ... ] } |

## Prepare

### Use an existing or request a new Bosch IoT Things service instance

Book the Bosch IoT Things cloud service as described in our [documentation](https://docs.bosch-iot-suite.com/things/getting-started/booking/). Follow the guide to manage your [namespace](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-namespace/) and [key-pair](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-key/). Store the things-client.jks file to the folder "src/main/resources".\
Book the Bosch IoT Permission cloud service and [register a user](https://docs.bosch-iot-suite.com/things/examples-demo/createuser/).

### Install and start a local MongoDB

See https://www.mongodb.org/

### Configure your settings

Create the config file `src/main/resources/config.properties`. Use `src/main/resources/config-template.properties` as an template. 


## Build and Run

```
mvn clean install
```

Use the following command to run the example.

```
mvn exec:java -Dexec.mainClass=com.bosch.iot.things.example.historian.Application
```

## Usage

### Add a policy subject for "historian" to your things

Add an entry in your policy (with our [HTTP API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v1#/Features/put_things__thingId__features__featureId__properties__propertyPath_)) for the "historian"-client to any thing you already have.\
If you do not have a device yet, see the [inventory-browser](https://github.com/bosch-io/iot-things-examples/tree/master/inventory-browser) example to create a device.
```
...
    "subjects": {
        "### your solution id ###:historian" {
          "type": "generated"
    }
...
```

### Look at your Data

Use the following URL to look at the collected data and authenticate with your permissions user:

http://localhost:8080/history/data/###thingId###/features/###featureId###/properties/###propertyPath###

You can specify multiple things/features/properties to get data for multiple values in one result.
To do this you can use comma separated values within square brackets to define multiple parameters.

e.g.

- http://localhost:8080/history/data/demo:vehicle-53/features/geolocation/properties/geoposition/latitude
- http://localhost:8080/history/data/demo:vehicle-53/features/geolocation/properties/geoposition/[latitude,longitude]
- http://localhost:8080/history/data/demo:vehicle-53/features/[geolocation/properties/geoposition/latitude,enginetemperature/properties/value]
- http://localhost:8080/history/data/[demo:vehicle-53/features/geolocation/properties/geoposition/latitude,demo:vehicle-99/features/geolocation/properties/geoposition/latitude]

Use the following URL to view at the collected data as a timeseries chart, following the same format above to take into account multiple feature/values. Authenticate with your permissions user:

http://localhost:8080/history/view/###thingId###/features/###featureId###/properties/###propertyPath###

e.g.
- http://localhost:8080/history/view/demo:vehicle-53/features/geolocation/properties/geoposition/latitude
- http://localhost:8080/history/view/demo:vehicle-53/features/[geolocation/properties/geoposition/latitude,enginetemperature/properties/value]

## License

See the iot-things-examples top level README.md file for license details.
