# Bosch IoT Things - Historian based on InfluxDB

This example shows a simple historian service that pushes modifications of Things to an InfluxDB and provides query commands on that data.
Based on the data collection a dashboard using Grafana can be created for visualization.

# Prepare

## Use an existing or request a new Bosch IoT Things service instance

[Book the Bosch IoT Things cloud service](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking)

## Configure your settings

Set your credentials in the file "config.json". You can copy "config.json-template" as template and fill out placeholders.

# Build and Run

```
npm install
npm run build
npm run start
```

If you need to access the Internet using a Proxy configuration, please make sure to set the environment variable HTTPS_PROXY.

# Usage

## Prepare access for History collection and History query execution

Add a section like the follwing to the policy/policies of your things in order to grant read access to the Historian service on data and query command messages.

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
    },
    "message:/features/Historian/inbox/messages/historianQuery": {
      "grant": ["READ"],
      "revoke": []
    }
  }
}
```

## Invoke query

To query/analyse collected Thing history data you could either work on a global level directly on your InfluxDB or you can use the Historian service to manage queriy execution in the context of individual Things. Using the latter approach the full access control check is applied for these query invocations and only allowed subjects are able to query the data.

The message that describes query invocations is defined based the following Eclipse Vorto functionblock:
[http://vorto.eclipse.org/#/details/org.eclipse.ditto/Historian/1.0.0]

After adding a respective feature (e.g. with id "Historian") to your Things you can invoke the message.

An example invocation can be done as follows (using cURL with Bash syntax):
```shell
curl -X POST \
  https://things.s-apps.de1.bosch-iot-cloud.com/api/2/things/...thing-id.../features/Historian/inbox/messages/historianQuery \
  --user ...user:password... \
  -H 'x-cr-api-token: ...your-api-token...' \
  -H 'Content-Type: application/json' \
  -d '{
	"fields": "mean(\"value\")",
	"from": "\"Barometer_0.status.sensorValue\"",
	"where": "time >= 1521244012288ms and time <= 1521346982743ms",
	"groupBy": "time(2m)"
}'
```

# License
See the iot-things-examples top level README.md file for license details.
