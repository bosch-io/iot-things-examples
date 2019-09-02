# Bosch IoT Things - Batch Importer Tool

### Description
This tool is designed to import things from one or more files in a specific directory into a Bosch IoT Things service instance.
The file(s) should contain one thing per line in JSON format e.g.

{ "thingId": "namespace:thing-name", "policyId": "namespace:policy-name", "attributes": { "foo": 1 }, "features": {...} }


##### Prerequisites:

- Knowledge of Java
- Knowledge of Maven
- [Solution](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:manage-base) information like solutionId and apiToken have to be present.
- [Namespace](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:manage-solution-namespace) in which the things should be imported, have to be created.
- Import file(s) with one thing per line in JSON format.
- [User of Bosch IoT Permissions](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=examples_demo:createuser) or - alternativly - [Public Key](https://things.eu-1.bosch-iot-suite.com/dokuwiki/doku.php?id=2_getting_started:booking:manage-key) for authenticating the Things client.
- WebsocketEndpoint have to be configured in config.properties.

### Preperation

Create at least one [policy](https://docs.bosch-iot-suite.com/asset-communication/Initial-policy.html) which you can assigned to your things.\
Set your credentials under "/src/main/resources/config.properties". 

### How to build things batch importer tool
Build the jar file with following command.
```bash 
mvn clean install
```

### How to run things batch importer tool 

```$bash
cd target
java -Xms2G -Xmx4G -DthingsConfigFile="### absolutePathToConfig ###" -jar things-batch-importer-0-SNAPSHOT-jar-with-dependencies.jar "### absolutePathToUploadDirectory ###"
```

If the import is interrupted the import tool can just be re-executed. It then continues to import where it previously stopped.

### Created files during batch import
The import tool will create following files during the batch import.
- completedFile.txt - contains all files which were uploaded successfully.
- errorFile - contains the error messages for the things which could not been uploaded.
- retryFile.txt - contains the things and the error message why it could not been uploaded separated by a '#'. 

# License

See the iot-things-examples top level README.md file for license details.
