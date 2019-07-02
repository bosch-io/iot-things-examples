# Bosch IoT Things - HTTP Forwarder

This example shows a simple HTTP forwarder service implementation that pushes modifications of Things - managed with Bosch IoT Things - to an extern HTTP endpoint.

This example can be used as basis for custom external application integrations.

The forwarder service listens to Thing signals via WebSocket and pushes Thing modifications as normalized JSON documents to an extern HTTP endpoint. The JSON documents are normalized and sparse, i.e. contain only modified values but with the full structure to these modifications.

# Prepare

## Use an existing or request a new Bosch IoT Things service instance

[Book the Bosch IoT Things cloud service](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:start)

## Configure your settings

Set your credentials in the file "config.json". You can copy "config.json-template" as template and fill out placeholders.

# Setup development tools

Install Node.js (version 10+, incl. npm) and TypeScript (version 3.5+).

# Build and Run

```
npm install
tsc
npm run start
```

If you need to access the Internet using a Proxy configuration, please make sure to set the environment variable HTTPS_PROXY.

# Usage

## Prepare access rights

Add a section like the following to the policy/policies of your things in order to grant read access to the forwarder service on data that it should forward to an external HTTP endpoint.

```json
{
  "subjects": {
    "iot-permissions:<<<your-bosch-iot-permissions-user-used-for-historian>>>": {
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

# License
See the iot-things-examples top level README.md file for license details.
