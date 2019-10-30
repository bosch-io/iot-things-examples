# Bosch IoT Things - HTTP Forwarder

This example shows a simple HTTP forwarder service implementation that pushes modifications of Things - managed with Bosch IoT Things - to an extern HTTP endpoint.

This example can be used as basis for custom external application integrations.

The forwarder service listens to Thing signals via WebSocket and pushes Thing modifications as normalized JSON documents to an extern HTTP endpoint. The JSON documents are normalized and sparse, i.e. contain only modified values but with the full structure to these modifications.


## Knowledge prerequisites

To understand this example, knowledge of following is required:
- TypeScript
- npm

# Preparation

## Use existing or request new Bosch IoT service instances

Book the Bosch IoT Things cloud service as described in our [documentation](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:start). Follow the guide to manage your namespace.
Book the Bosch IoT Permission cloud service and register one users as described [here](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_demo:createuser).

## Create a Thing

You should have at least one Thing which you can modify. If you don't have one yet, you can create one with our [http API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/Things/put_things__thingId_). 

## Prepare access rights

Add a section like the following to the policy/policies of your things. It will grant read access to the forwarder service data, that should forward to an external HTTP endpoint. You can set you policy in our [http API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/Policies/put_policies__policyId_).

```json
{
  "subjects": {
    "iot-permissions:### permissions user id ###": {
      "type": "iot-permissions-userid"
    }
  },
  "resources": {
    "thing:/": {
      "grant": ["READ"],
      "revoke": []
    }
  }
}
```

## Configure your settings

Set your credentials in the file "config.json". You can copy "config.json-template" as template and fill out placeholders.

## Setup development tools

Setup:
* NodeJs (tested with version 10.15.3)
* npm (tested with version 6.4.1)
* tsc (tested with version 3.5.2). Be careful! There is an issue with versions of typescript 3.6.x. See issue (https://github.com/bsinno/iot-things-examples/issues/33).

# Build and Run

```
npm install
tsc
npm run start
```
If you need to access the Internet using a Proxy configuration, please make sure to set the environment variable HTTPS_PROXY.\
(Do not forget that a HTTP request is only forwarded if you modify a thing. As an example you could modify a feature with our [http API](https://apidocs.bosch-iot-suite.com/?urls.primaryName=Bosch%20IoT%20Things%20-%20API%20v2#/Features/put_things__thingId__features__featureId__properties__propertyPath_))

# License
See the iot-things-examples top level README.md file for license details.
