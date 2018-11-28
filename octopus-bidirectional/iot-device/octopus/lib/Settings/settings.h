#ifndef SETTINGS_H
#define SETTINGS_H

// ---- WiFi configuration ----
#define WIFI_SSID "gtm1imb_btia" // The SSID of the WiFi you want your octopus board to connect to
#define WIFI_PASSWORD "inet4iot" // The password of the WiFi you want your octopus board to connect to

// ---- Things registration properties ----
#define THINGS_NAMESPACE "joos.test" // The namespace you created in your solution
#define THING_ID "joos.test:octopus" // should not be changed unless you changed code in the java preparation program

// ---- Hub registration properties ----
#define HUB_TENANT "t72c2ced92da1485eac4ddd08654ef3e6" // The tenant id of your hub instance
#define HUB_DEVICE_ID "joos.test:octopus"              // The device id that was printed out by the java preparation program
#define HUB_DEVICE_AUTH_ID "octopus"                   // The auth id that was printed out by the java preparation program
#define HUB_DEVICE_PASSWORD "octopus"                  // The device password that was printed out by the java preparation program

// ---- Update rate of sensors ----
#define SENSOR_UPDATE_RATE_MS 5000 // Print updated sensor value every 5 seconds
#define LOOP_DELAY 100

// ---- Hub MQTT configuration ----
// Do not change this
#define MQTT_BROKER "mqtt.bosch-iot-hub.com"
#define MQTT_PORT 8883

//#define BME280 // uncomment this line if your board has a BME280 instead of BME680

extern const unsigned char mqtt_server_ca[];
extern const unsigned int mqtt_server_ca_len;

#endif