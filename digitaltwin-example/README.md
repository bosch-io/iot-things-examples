# Bosch IoT Things - End-to-End Digital Twin Example

This example shows a simple end-to-end scenario for digital twins based on Bosch IoT Things / Eclipse Ditto.

# General concept

## Introduction

A digital twin is an orchestration of many (all) aspects of an IoT device/product asset in order to get to a unified and simplified model and API to work with this IoT asset.
Each digital twin is represented as Thing and the aspects a represented as Features within this Thing.\
Some of these Features might represent a state with properties, while others represent an interface to some functionality (e.g. operations or events), and some Features are both.

Normally there are "contracts" that define the structure of the state and/or the interfaces of functionality. These contracts are defined using Eclipse Vorto by describing Function Blocks. Some Features may also be "free form", i.e. there is no "written" contract that defines its state/functionality.

Finally, there needs to be a place where the orchestration is described. Policies are used to manage the orchestration. They include the roles and access rights and by this directly define the responsibility of these roles.

The following conceptual model describe the composition of a digital twin:

![concept](doc/digitaltwin-concept.png)

## Implementation and Deployment of Digital Twins

A digital twin can be implemented by using Eclipse Ditto for managing the orchestration and the state information of individual Features. In addition to this, the implementation of custom functionality is provided by custom microservices that are integrated into the overall digital twin.
The user of a digital twin (e.g. business application, frontend) can interact with the digital twins using the state and functionality provided via a single unified API.

All custom microservices that implement functionality of one/multiple Features can be integrated into the digital twin by using the Eclipse Ditto protocol via multiple protocol bindings. You can use either a WebSocket binding, AMQP 1.0, or AMQP 0.91 (RabbitMQ) binding, depending on what is best suited regarding technology and non-functional requirements.

The most important characteristic of a digital twin is the representation of state and the functionality of the physical device that is connected to the Internet. This integration is done using the same approach and explicitly prepared for integration with Eclipse Hono.

The following diagram shows deployment options for digital twin with Bosch IoT Things / Eclipse Ditto:

![deployment](doc/digitaltwin-deployment.png)

# Example

## Example Digital Twin

This example illustrates the implementation of a digital twin with some typical aspects:
- **Device**: a feature that represents the state of a connected device. The device regularly measures the temperature and has a configured threshold value to adjust the minimum temperature that should be reported to the digital twin.\
The example contract is defined in: [http://vorto.eclipse.org/#/details/com.acme.device/D100/2.1.0]
- **Commissioning**: a feature (separate to _Device_) that abstracts the "workflow" to execute all preparation steps for a new device, so that it can be connected afterwards. The workflow interface is included in the digital twin in order to be part of the overall orchestration including access control and to support reflecting status of the commissioning process within the digital twin. In the example, the commissioning implements the registration of the device in Eclipse Hono.\
The contract is defined in: [http://vorto.eclipse.org/#/details/org.eclipse.ditto/HonoCommissioning/1.0.0]
- **Accessories**: a custom functionality to determine supported accessory products that can be combined with the device (e.g. batteries, spare parts). In real-world scenarios this business functionality could be retrieved from a product catalog system (e.g. via SAP).
The example contract is defined in: [http://vorto.eclipse.org/#/details/com.acme.catalog/Accessories/2.0.0]
- **Descriptive**: a small, reusable aspect with general-purpose descriptive information about a thing, defined as "static" state properties.
The contract is defined in: [http://vorto.eclipse.org/#/details/org.eclipse.vorto.standard/Descriptive/1.0.0]
- **ProductInfo**: an unstructured set of properties describing more information about the overall product. There is no contract for this feature.

Adding all of these aspects in the general conceptual model gives the following picture:

![concept-example](doc/digitaltwin-concept-example.png)

## Example microservice implementation

The example implementation includes all the microservices that provide the features of the digital twin as well as an exemplary business application ("Frontend") in one single runtime application based on Node.js.
In addition, it adds a simple device simulation microservice that simulates a real physical device by sending telemetry data and respecting configuration data.

INFO: The device simulation currently uses the Eclipse Hono HTTP channel to emit telemetry data AND in parallel the Bosch IoT Things / Eclipse Ditto WebSocket channel to receive configuration changes. The WebSocket channel is not proposed for large scale scenarios with high number of device connections but should be replaced by an appropriate device connectivity channel. As soon as Eclipse Hono supports [command&control](https://www.eclipse.org/hono/api/command-and-control-api/) using MQTT the simulation could be switched to it for both channels.

Following the deployment model from above this looks like this:

![concept-example](doc/digitaltwin-deployment-example.png)

The policy-based orchestration works with different (technical) users that are used for each microservice. In the policy notation the IDs of these users are called subjects and the subjects reflect the role each microservice has within the digital twin:
You will need users for following roles:
- **owner**: this is a user that owns the overall digital twin. It is set-up to have all access rights on all features and the policy itself. In the example the _Frontend_ user is the owner of the digital twin.
- **integration**: this is a "virtual" user/subject that is used to define access rights used in the integration with Eclipse Hono. This subject is allowed to write status properties and read configuration properties. As it is "virtual" no real (technical) user entity is required, but any unique, arbitrary subject ID can be used for that.
- **simulation**: used by the device simulation microservice to act as replacement for a real physical device. It will be configured with the same access rights as the _Integration_ subject.
- **accessories**: as the example accessories microservice uses a message-based interaction pattern ("retrieveSupportedAccessories") this subject requires receive permissions on these messages. The retrieval is based on product information and so this subject requires access on the respective _ProductInfo_ feature also.
- **commissioning**: the commissioning workflow is also integrated using message-based interaction patterns (e.g. "commissionDevice"). Access rights to receive these messages are defined and also access rights to manage the state of the _Commissioning_ feature in order to write result information.

# Prepare

## Use an existing or request a new Bosch IoT Things service instance

Book the Bosch IoT Things cloud service: as decribed in our [documentation](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking)

## Only required for device integration/simulation: Use an existing or request a new Bosch IoT Hub tenant

Request your own tenant for the Bosch IoT Hub (beta): see [http://docs.bosch-iot-hub.com/] for details.

After you have both instances (Things and Hub) in place, you can setup the integration between the two.
Find background information in our [documentation](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=005_dev_guide:006_message:007_protocol_bindings:amqp10_binding).

## Prepare users (subjects) for each microservice

As described above, the microservices of a digital twin use different (technical) users/subjects. To prepare and manage these subjects you can use [Bosch IoT Permissions](https://www.bosch-iot-suite.com/permissions/).
For evaluation/example scenarios you can alternatively setup some evaluation users as described at: [Register Evaluation User](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=006_demo:01_createuser).

## Configure your settings

Set your credentials in a file called "config.json". You can copy "config.json-template" as template and fill out the placeholders.

# Build and Run

```
npm install
npm run build
npm run start
```

If you need to access the Internet using a proxy configuration, please make sure to set the environment variable HTTPS_PROXY.

# Extensions / Further reading

A lot of usage scenarios of digital twins require the integration of **history data** of properties of one or more Features of a digital twin. Therefore we provide an example implementation of a general-purpose historian service that can be easily plugged into any digital twin to provide a managed way for collecting and accessing history data. See this example for details: [https://github.com/bsinno/iot-things-examples/tree/dev/historian-influxdb]

# License
See the iot-things-examples top level README.md file for license details.
