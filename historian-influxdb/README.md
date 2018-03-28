# Bosch IoT Things - Historian based on InfluxDB

This example shows a simple historian service implementation that pushes modifications of Things managed with Bosch IoT Things to an InfluxDB time series database and supports execution of queries on the collected data.

This example can be used as basis for custom historian implementations and visualizations (e.g. by using a Grafana dashboard) and it cloud also be included in a Digital Twin approach where history data is directly accessible within the Digital Twin API.

INFO: The use of InfluxDB does not raise a claim, that this is the best suited time series database for this purpose. A very similar approach could have been implemented using Prometheus, OpenTSDB, etc. It is just used as a simple example.

# Introduction

This Historian example addresses two topics:
- **Collecting** all (streamed) Thing modifications in an InfluxDB time series database.\
The collection is _scoped_ to the defined read access rights according to policies, i.e. only explicitly marked Things or marked fine-grained properties within Things are written to this database.
- **Execution of queries** to retrieve/analyse the collected data is provided in the _context_ of an individual Thing.\
This query execution can be integrated into the Thing API by using the messaging functionality of Bosch IoT Things. This way the query execution is usable as any other functionality of a Thing by using the Thing API, e.g. as sketched in this [Digital Twin example](https://github.com/bsinno/iot-things-examples/tree/dev/digitaltwin-example).\
This context-based query execution can be used in addition or as replacement to the execution of queries directly on the time series database on a _global context_ that would not respect individual access rights on individual things but only general access rights to the database.

# Prepare

## Use an existing or request a new Bosch IoT Things service instance

[Book the Bosch IoT Things cloud service](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking)

## Use or setup an InfluxDB instance

Using [Docker](https://www.docker.com/) you can easly run an InfluxDB server on a Linux machine:\
``docker run -d --rm --name influxdb -p 8086:8086 -v $PWD/data:/var/lib/influxdb influxdb``

Afterwards create a database within this server:\
``docker exec -it influxdb influx -execute 'create database mydb'``

See [InfluxDB Docker image](https://store.docker.com/images/influxdb) for detailed information.

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

To query/analyse collected Thing history data you could either work on a global level directly on your InfluxDB or you can use the Historian service to manage query execution in the context of individual Things. By using the latter approach the full access control check is applied for these query invocations and only allowed subjects are able to query the data.

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
