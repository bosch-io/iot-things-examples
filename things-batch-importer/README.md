# Things Batch Importer Tool

### Description
This tool is designed to import things from one or more files in a specific directory. 
The file(s) should contain one thing per line in JSON format e.g.

{ "thingId": "namespace:thing-name", "policyId": "namespace:policy-name", "attributes": { "foo": 1 }, "features": {...} }


##### Prerequisites:

- Solution information like solutionId and apiToken have to be present.
- Namespace in which the things should be imported, have to be created.
- Import file(s) with one thing per line in JSON format.
- Permissions User or Public Key for authenticating the Things client.
- WebsocketEndpoint have to be configured in config.properties.

Example for config.properties file:
```
## WebSocket Endpoint
# AWS Prod
#webSocketEndpoint=wss://things.eu-1.bosch-iot-suite.com/
# BIC Prod
#webSocketEndpoint=wss://https://things.s-apps.de1.bosch-iot-cloud.com/

## Solution information
solutionId=### your solutiionId ###
apiToken=### your apiToken> ###

#Either use Permissions user or Public Key for Authentication
# Uncomment one of the following sections
## Permissions User
#username=Tenant\\username
#password=

## Public Key for Authentication
#keystoreLocation=ThingsClient.jks
#keystorePassword=
#keystoreAlias=things
#keystoreAliasPassword=

## Optional proxy configuration
#proxyHost=localhost
#proxyPort=3128
#proxyPrincipal=### your http proxy principal (user), if you need one ###
#proxyPassword=### your http proxy password, if you need one ###

```

### How to build things batch importer tool
Build the jaf file with following command.
```bash 
mvn clean install
```

### How to run things batch importer tool 

```$bash
java -Xms2G -Xmx4G -DthingsConfigFile=<absolutePathToConfig> -jar things-batch-importer-0-SNAPSHOT-jar-with-dependencies.jar <absolutePathToUploadDirectory>
```

### Created files during batch import
The Tool will create following files during the batch import.
- completedFile.txt - contains all files which were uploaded successfully.
- errorFile - contains the error messages for the things which could not been uploaded.
- retryFile.txt - contains the things and the error message why it could not been uploaded separated by a '#'. 

