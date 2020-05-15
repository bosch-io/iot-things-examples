# Octopus device integration

This example provides a prototype of a real world device integration - based on the Octopus board (ESP8266).
It shows how to subscribe to Bosch IoT Suite for Asset Communication and use it's API to provision a device.

The octopus will be able to connect automatically to a given wireless internet access, to send telemetry data to the
Things service, and to react to messages which can be sent by a [web application](../octopus-app).

Before you can start, you have to prepare your setup. This includes the following steps:
1. [Subscribe for the Bosch IoT Suite for Asset Communication](#setting-up-bosch-iot-suite-for-asset-communication)
2. [Register the device via Device Provisioning API](#device-provisioning-api)
3. [Set-up the Arduino IDE](#prepare-the-octopus-device-with-arduino)

We will use the _telemetry_, _event_ as well as the _command & control_ pattern of the Bosch IoT Hub.

![](./images/overview.png)

## About the Octopus board
The Octopus board is created by Guido Burger. Its original purpose was to be used as a teaching tool for hackatons in
secondary schools in Germany. It features a number of sensors, and the ability to connect sensors, inputs, and
actuators in a relatively simple way. More information and the source code for the schematics can be found on the
<a href="https://www.tindie.com/products/FabLab/iot-octopus-badge-for-iot-evaluation/">Fab-Lab.eu Octopus page</a>.
While Guido Burger offers some boards in his Tindie store, overall the Octopus board is a not-for-profit activity.
The Octopus board is a small board based on a ESP8266 chip that can be programmed e.g. using the Arduino IDE.
The special thing about this board is, that it already contains components that makes it a ready-to-run starter-kit
to experiment with the Internet of Things.
Here you can see a detailed description of the official Octopus board used for the "Nationaler IT Gipfel".

<img alt="Drawing" style="width: 640px;height: 360px" src="https://cdn.tindiemedia.com/images/resize/tPhVtjN_DuxDKaRkY0-bOKacDbU=/p/74x59:1024x692/full-fit-in/2400x1600/i/52962/products/2016-12-08T20%3A25%3A54.337Z-octo_pinout_final_top.jpg"/>

Source: [Tindimedia](https://cdn.tindiemedia.com/images/resize/tPhVtjN_DuxDKaRkY0-bOKacDbU=/p/74x59:1024x692/full-fit-in/2400x1600/i/52962/products/2016-12-08T20%3A25%3A54.337Z-octo_pinout_final_top.jpg)

For example, the Bosch IoT Suite edition board contains the following sensors:
* [Bosch Sensortec BNO055](https://www.bosch-sensortec.com/bst/products/all_products/bno055)
9-axis absolute orientation sensor – provides acceleration, gyroscope, spatial positioning, magnetic field etc.
* [Bosch Sensortec BME680](https://www.bosch-sensortec.com/bst/products/all_products/bme680)
environmental sensor – provides temperature, humidity, air pressure, altitude, air quality

## Setting up Bosch IoT Suite for Asset Communication

All services can be booked online at [Bosch IoT Suite](https://bosch-iot-suite.com/tutorials/howtosubscribe/) portal. For your subscription, you will need a
_Bosch ID_ for authentication. If you don't have a Bosch ID yet, feel free to register a new account. Once you are successfully registered, you will be redirected to the Bosch IoT Suite portal.

You will need to subscribe for **Bosch IoT Suite for Asset Communication** - a ready-to-use integration of Bosch IoT Hub and Bosch IoT Things. Furthermore, you will get a pre-configured connection between both services and a thing-dashboard. In order to book your **Bosch IoT Suite for Asset Communication**, please stick to the [Booking a package](https://docs.bosch-iot-suite.com/asset-communication/Subscribe-a-package-instance.html) and [First configuration steps](https://docs.bosch-iot-suite.com/asset-communication/First-configuration-steps.html) sections of our [Getting Started](https://www.bosch-iot-suite.com/getting-started-bosch-iot-suite-asset-communication/).

### Namespace

Once you have an own service instance of the package, we can define a **namespace** for your solution. All things and policies are required to be created with a namespace. In order to set a namespace, go to your _Service Subscription page_ of the Bosch IoT Suite. Click **Go to Dashboard** and navigate to the **Namespace** tab. There, you can type in your namespace in the dedicated input field.

The `namespace` must conform to the reserve domain name notation:
* _must_ start with a lower- or uppercase character from a-z
* _can_ use dots `(.)` to separate characters
* a dot `(.)` must be followed by a lower- or uppercase character from a-z
* numbers _can_ be used
* underscore _can_ be used

## Device Provisioning API

With just one request at our API, you will be able to register a device (in the context of the Bosch IoT Hub service) and create a digital twin representation of this device (in the context of the Bosch IoT Things service) in thing notation.

In order to do so, you will need a Suite authorization token and a valid request body for your device registration. Get a new Suite auth token by following the steps of the [Create a Suite Auth Client](https://docs.bosch-iot-suite.com/asset-communication/Device-provisioning.html#src-894245057_Deviceprovisioning-CreateaSuiteAuthclient) section of the Getting Started.

Subsequently, open the [Bosch IoT Suite - Device Provisioning API](https://apidocs.bosch-iot-suite.com/index.html?urls.primaryName=Bosch%20IoT%20Suite%20-%20Device%20Provisioning#/provisioning/post__service_instance_id__devices), where you can execute your device registration.

You will need to do the following steps:
1. Authorize your API request via Suite authorization token, by clicking on the **Authorize** button on the upper right corner and paste the token into the dedicated input field.
2. Provide your _service-instance-id_ on the required input-field. You can find your _service-instance-id_ under the **Show Credentials** button of your  _Service Subscription page_ in the Bosch IoT Suite.
3. Edit the request body to send a valid message to the server.

Your request body should contain the following information:

```json
{
  "id": "<your-namespace>:<your-device-id>",
  "hub": {
    "device": {
      "enabled": true
    },
    "credentials": {
      "type": "hashed-password",
      "secrets": [
        {
          "password": "<any-password>"
        }
      ]
    }
  },
  "things": {
    "thing": {
      "definition": "com.bosch.iot.suite.example.octopussuiteedition:OctopusSuiteEdition:1.1.0",
      "attributes": {
        "manufacturer": "<my-awesome-company>"
      },
      "features": {
        "acceleration": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Accelerometer:1.1.0"
          ]
        },
        "ambient_temperature": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Temperature:1.1.0"
          ]
        },
        "orientation": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:MultipleAxisJoystick:1.1.0"
          ]
        },
        "linear_acceleration": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Accelerometer:1.1.0"
          ]
        },
        "magnetometer": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Magnetometer:1.1.0"
          ]
        },
        "gravity": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Accelerometer:1.1.0"
          ]
        },
        "temperature": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Temperature:1.1.0"
          ]
        },
        "humidity": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Humidity:1.1.0"
          ]
        },
        "pressure": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Barometer:1.1.0"
          ]
        },
        "angular_velocity": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Gyrometer:1.1.0"
          ]
        },
        "voltage": {
          "definition": [
            "com.bosch.iot.suite.example.octopussuiteedition:Voltage:1.1.0"
          ]
        }
      }
    }
  }
}
```

You will need to edit the following <placeholders>:
* "id": "`<your-namespace>:<your-device-id>`" - _Use your created namespace followed by_ `:` _and your specific thing ID. In our use case it should be_ `yourNamespace:octopus`.
* "password": "`any-password`" - _Type in a secure password in plain text. It will be hashed on our server._
* "manufacturer": "`<my-awesome-company>`" - _Type in your company Name._

Click _Execute_ to submit the request.

Upon success, you have created a _device_ in the context of Bosch IoT Hub associated with credentials, and an empty _digital twin_ in _thing_ notation associated with a default policy.

## Prepare the Octopus device with Arduino

### Requirements

1. An Arduino or another developer board like "Funduino" etc. </br> This example will work with an
   Octopus-board, </br>however, most of the code will work with every other board with an ESP8266 on it.
2. Download the [Arduino IDE](https://www.arduino.cc/en/Main/Software)

### Preparing

1. Add the ESP8266 Platform to the IDE, see [ESP8266 Arduino Platform](https://github.com/esp8266/Arduino) (tested with 2.4.1).
2. Install the following libraries (Sketch -> Include Library -> Manage Libraries)
   * [Adafruit BME680](https://github.com/adafruit/Adafruit_BME680) (tested with 1.0.7)
   * [Adafruit BME280](https://github.com/adafruit/Adafruit_BME280) (tested with 1.0.7)
   * [Adafruit BNO055](https://github.com/adafruit/Adafruit_BNO055) (tested with 1.1.6)
   * [Adafruit NeoPixel](https://github.com/adafruit/Adafruit_NeoPixel) (tested with 1.1.7)
   * [PubSubClient](https://github.com/knolleary/pubsubclient) (tested with 2.7.0)
   * [ArduinoJson](https://github.com/bblanchon/ArduinoJson) (tested with 5.13.4)
   * [ESP8266-ping](https://github.com/dancol90/ESP8266Ping) (tested with 2.0.1)
3. _IMPORTANT:_ Edit the file `${ArduinoDirectory}/libraries/pubsubclient/src/PubSubClient.h` and set the
   `MQTT_MAX_PACKET_SIZE` to `2048`.
4. Change the Board (Tools -> Board: -> Adafruit Feather HUZZAH ESP8266)

### Configure with valid credentials

The Arduino Sketch we have prepared publishes the sensor information via the Bosch IoT Hub to Bosch IoT Things.

**Tip**: Find the information model of the Octopus device in the Eclipse Vorto repository.
https://vorto.eclipse.org/#/details/com.bosch.iot.suite.example.octopussuiteedition:OctopusSuiteEdition:1.1.0

Open `octopus-hub/octopus-hub.ino` in your Arduino IDE.

All properties relevant for the connection to our cloud services have to be set in `octopus-hub/settings.h`.
You can use `octopus-hub/settings-template.h` as a template. Replace all `XXX` placeholders with your configuration properties and write your credentials within the `" "` quotation marks.

Once you have stored the file at the expected location, verify the sketch.

You can flash the Sketch to your Octopus board. The device will connect automatically to Bosch IoT Hub, which forwards the data to Bosch IoT Things.

The prepared Arduino sketch will connect to the Bosch IoT Hub with TLS standard,
send and receive MQTT messages, read sensors data, and depending on incoming messages (from the web application) it will set new values for the LED on the board.

Feel free to play with code.
Happy coding!
