# Using the Octopus board with the Bosch IoT Suite

This example shows how to use the Octopus board (Bosch IoT Suite edition) with the Bosch IoT Suite.
In the image below, we illustrated the components of this example and how they will interact with each other.
![Visualisation](images/exampleVisualizationpng.png)

Before you can start, you have to prepare your setup. This includes the following steps:
1. [Setting up the Arduino IDE](#setup-ide)
2. [Subscribe for the Bosch IoT Suite service instances](#subscribe-for-bosch-iot-suite-service-instances)
5. [Configure the example with your credentials](#configure-the-example)

## Requirements

* JDK 8 or higher
* Maven 3

## About the Octopus board
The Octopus board is created by Guido Burger. Its original purpose was to be used as a teaching tool for Hackathons in
secondary schools in Germany. It features a number of sensors, and the ability to connect sensors, inputs, and 
actuators in a relatively simple way. More information and the source code for the schematics can be found on the 
<a href="https://www.tindie.com/products/FabLab/iot-octopus-badge-for-iot-evaluation/">Fab-Lab.eu Octopus page</a>. 
While Guido Burger offers some boards in his Tindie store, overall the Octopus board is a not-for-profit activity.
The Octopus board is a small board based on a ESP8266 Chip that can be programmed e.g. using the Arduino IDE.
The special thing about this board is, that it already contains components that makes it a ready-to-run starter-kit 
to experiment with the Internet of Things.
Here you can see a detailed description of the official Octopus Board used for the "Nationaler IT Gipfel".

<img alt="Drawing" style="width: 640px;height: 360px" src="https://cdn.tindiemedia.com/images/resize/tPhVtjN_DuxDKaRkY0-bOKacDbU=/p/74x59:1024x692/full-fit-in/2400x1600/i/52962/products/2016-12-08T20%3A25%3A54.337Z-octo_pinout_final_top.jpg"/>

Source: [Tindimedia](https://cdn.tindiemedia.com/images/resize/tPhVtjN_DuxDKaRkY0-bOKacDbU=/p/74x59:1024x692/full-fit-in/2400x1600/i/52962/products/2016-12-08T20%3A25%3A54.337Z-octo_pinout_final_top.jpg)


For example, the Bosch IoT Suite edition board contains the following sensors:
* [Bosch Sensortec BNO055](https://www.bosch-sensortec.com/bst/products/all_products/bno055) 
9-axis absolute orientation sensor – provides acceleration, gyroscope, spatial positioning, magnetic field etc.
* [Bosch Sensortec BME680](https://www.bosch-sensortec.com/bst/products/all_products/bme680)
environmental sensor – provides temperature, humidity, air pressure, altitude, air quality

![Bosch IoT Suite Edition](images/octopus.jpg)

In this example we use both of these sensors as well as the WiFi component and the two LEDs.
## Programming your board
To program your board you can use the [Arduino IDE](https://www.arduino.cc/en/Main/Software).
There you can write the code that should be executed on your board and upload it to your board.

### Setup IDE
1. Download [Arduino IDE](https://www.arduino.cc/en/Main/Software)
2. Configure [ESP8266 board support](https://learn.adafruit.com/adafruit-feather-huzzah-esp8266/using-arduino-ide#install-the-esp8266-board-package)
3. Install the following libraries (Sketch > Include Library > Manage Libraries)
    * [Adafruit Unified Sensor library](https://github.com/adafruit/Adafruit_Sensor)
    * [Adafruit BME680 library](https://github.com/adafruit/Adafruit_BME680)
    * [Adafruit BNO055 library](https://github.com/adafruit/Adafruit_BNO055)
    * [Adafruit NeoPixel library](https://github.com/adafruit/Adafruit_NeoPixel)
    * [PubSubClient library](https://github.com/knolleary/pubsubclient)
4. Edit the file `${ArduinoDirectory}/libraries/pubsubclient/src/PubSubClient.h` and set the MQTT_MAX_PACKET_SIZE
to 2048. This is required because the size of our MQTT messages sent using the PubSubClient library have to fit into
an array of this size. Unfortunately, we cannot define MQTT_MAX_PACKET_SIZE in our sources because of the way Arduino IDE
compiles.

With this setup, you can run our example that demonstrates how to retrieve the sensor values of your
board. Open `src/main/octopus/octopus-sensor-only/octopus-sensor-only.ino` in Arduino IDE and upload it to your
board.
Next, open Tools>Serial Monitor, specify 115200 baud and you will see the values reported by the sensors printed out.

## Subscribe for Bosch IoT Suite service instances
All cloud services of the Bosch IoT Suite can be booked online at the [Bosch IoT Suite portal](https://accounts.bosch-iot-suite.com/subscriptions).
For all subscriptions, you will need to authenticate with a Bosch ID. In case you have no Bosch ID yet, feel free to register a new user account.
Once the authentication is successful, you will be re-directed to the Bosch IoT Suite portal.

### Bosch IoT Things
Bosch IoT Things is a service that allows you to create a digital twin of a thing, in our example the Octopus board.
This means Bosch IoT Things will mirror your device and will make for example the values of the sensors of your board
available to any interested party you allow to access the information.
The cool thing hereby is that it doesn't matter if your device is available at the time the other party asks for 
sensor values.
Bosch IoT Things will deliver the last known state of your device.

For this example, you need a Bosch IoT Things service plan. A free plan can be booked at the
[Bosch IoT Suite portal](https://accounts.bosch-iot-suite.com/subscriptions).

* Click "New Subscription".
![Request new Subscription](images/newSubscription.PNG)
* Select "Bosch IoT Things"
![Select "Bosch IoT Things"](images/selectBoschIoTThings.png)
* Define a name for your new solution(1)<br/>
* Define a default namespace for your service instance(2)<br/>
* Submit the form by clicking on "Subscribe"(3)
![Create Solution](images/createSolution.png)

Well done! You have a free Bosch IoT Things service instance.
Now you can find the attributes, relevant for this example, when you click "Credentials" on your Bosch IoT Things 
service instance in the [Bosch IoT Suite portal](https://accounts.bosch-iot-suite.com/subscriptions). 


### Bosch IoT Hub
Bosch IoT Hub is a service that allows to connect devices through various protocols to applications of the Bosch
IoT Suite. For our example your Octopus will communicate via MQTT to the Bosch IoT Suite services.

For this example you need a Bosch IoT Hub service plan . A free plan can be booked at the
[Bosch IoT Suite portal](https://accounts.bosch-iot-suite.com/subscriptions).
  
* Click "New Subscription".
![Request new Subscription](images/newSubscription.PNG)
* Select "Bosch IoT Hub"
![Select "Bosch IoT Hub"](images/selectBoschIoTHub.png)
* Define a name for your new Hub instance(1)<br/>
* Submit the form by clicking "Subscribe"(2)
![Create Hub Instance](images/createHubInstance.png)

Well done! You have a free Bosch IoT Hub service instance.
Now you can find the attributes, relevant for this example, when you click "Credentials" on your Bosch IoT Hub service 
instance in the [Bosch IoT Suite portal](https://accounts.bosch-iot-suite.com/subscriptions). 

### Bosch IoT Permissions

Bosch IoT Permissions is a service that allows you to create and manage users inside the Bosch IoT Suite.
To make it easier for you to start with the Bosch IoT Suite we provide an instance of Bosch IoT Permissions.
Follow [this description](https://things.s-apps.de1.bosch-iot-cloud.com/dokuwiki/doku.php?id=006_demo:01_createuser)
if you don't have an instance of Bosch IoT Permissions, yet.
If you're already familiar with Bosch IoT Permissions you can use your own instance and create the user at your own
instance.
This user will be used as technical user to access the API of your Bosch IoT Suite service instances during this
example.

## Activate protocol binding
To allow Bosch IoT Things to retrieve messages you send via Bosch IoT Hub, you need to 
[create an AMQP-Connection in Bosch IoT Things](https://things.s-apps.de1.bosch-iot-cloud.com/solution/connections).
Use the credentials of your Bosch IoT Things instance to authenticate.
In the next menu select "Create your first connection".
* Set the Connection category to "Bosch IoT Hub" (1)
* Enter a name for you connection (2)
* Select Continue
![Create a new connection](images/createConnection1.png)

* Adapt the Coordinates section with the messaging-username and messaging password of your Bosch IoT Hub Instance.
![Adapt Coordinates section](images/createConnectionCoordinates.png)

* Adapt the Authorization section with the suffix "octopus". This subject must be part of the policy attached to your
thing. Otherwise, messages received via this connection are not allowed to modify your thing. 
The thing and the policy will be created by a Java bootstrapper in this tutorial. So for the ease of this tutorial
please use the suffix "octopus".
If you insist on using another suffix, you need to adapt the PolicyFactory in the Java bootstrapper.
![Adapt Authorization section](images/createConnectionAuthorization.png)

* Adapt the Sources section by adding "telemetry/${your-hub-tenant-id}"
![Adapt Sources section](images/createConnectionSources.png)

* Click on "Test Connection" to verify your connection. If the test completes successfully click "Create", if not
  double check the sections you have adapted.

## Configure the example

Now that you have plans of all Bosch IoT Suite services required to run this example, continue to configure the example.

There are two parts that need to be configured:
1. A Java program
2. The Arduino Sketch

### Configure the Java Program

We provided a small Java program that will do the following four steps for you:

* Register a representation of your Octopus board as a thing at Bosch IoT Things
* Create a policy in Bosch IoT Things that will define the access policy to the created thing.
  This policy defines that the owner (your permissions user) has full access to the Octopus twin and that messages from
  hub are allowed to write to the features of your Octopus twin.
* Register the device at Bosch IoT Hub
* Create credentials for the registered device so you can access it.

To make this work, the program needs a few configuration properties that you can define at 
`src/main/resource/application.properties`.

Then, you can start the program with the following command in a terminal inside the example directory:
 
 `mvn clean compile exec:java`
 
 All information about credentials and IDs will be printed out to the terminal.

### Configure the Arduino Sketch
The Arduino Sketch, we have prepared, publishes the sensor information via the Bosch IoT Hub to Bosch IoT Things.

Open `src/main/octopus/octopus-mqtt/octopus-mqtt.ino` in your Arduino IDE.

All properties have to be set in `src/main/octopus/octopus-mqtt/settings.h`
Just create this file from the following template and replace XXX placeholders with your configuration properties.

```
#ifndef SETTINGS_H
#define SETTING_H

// ---- WiFi configuration ----
#define WIFI_SSID "XXX" // The SSID of the WiFi you want your octopus board to connect to
#define WIFI_PASSWORD "XXX" // The password of the WiFi you want your octopus board to connect to

// ---- Things registration properties ----
#define THINGS_NAMESPACE "XXX" // The namespace you created in your solution
#define THING_ID "XXX" // should not be changed unless you changed code in the java preparation program

// ---- Hub registration properties ----
#define HUB_TENANT "XXX" // The tenant id of your hub instance
#define HUB_DEVICE_ID "XXX" // The device id that was printed out by the java preparation program
#define HUB_DEVICE_AUTH_ID "XXX" // The auth id that was printed out by the java preparation program
#define HUB_DEVICE_PASSWORD "XXX" // The device password that was printed out by the java preparation program

// ---- Update rate of sensors ----
#define SENSOR_UPDATE_RATE_MS 5000 // Print updated sensor value every 5 seconds
#define LOOP_DELAY 100

// ---- Hub MQTT configuration ----
// Do not change this
#define MQTT_BROKER "mqtt.bosch-iot-hub.com"
#define MQTT_PORT 8883
/* SHA-1 fingerprint of the server certificate of the MQTT broker, UPPERCASE and spacing */
#define MQTT_SERVER_FINGERPRINT "7E 8E 7E FF 65 3E C0 02 88 F4 43 AE C5 FE E0 ED 89 C6 E2 06"

#endif
```

## Retrieve stored sensor data from Bosch IoT Things

The data of the registered thing can be retrieved via the 
[HTTP API of Bosch IoT Things](https://things.s-apps.de1.bosch-iot-cloud.com/documentation/rest/#!/Things/get_things_thingId).

For the ease of this example we provide a view of the data at
`src/main/html/index.html`. The page refreshes every few seconds and displays the data retrieved from Bosch IoT Things.
Because of the 'same-origin-policy' you need to provide this html via a webserver.
For example IntelliJ supports this by right click on the index.html inside IntelliJ and select 'Open in Browser'.
We tested it in Firefox.

## Make it run!

You're now fully prepared to let your Octopus board publish its sensor information to Bosch IoT Things.

Just press "Upload" inside the Arduino IDE and wait until it's uploaded.
For troubleshooting, feel free to use the "Serial Monitor" of the Arduino IDE, where you can find the latest log
messages.
