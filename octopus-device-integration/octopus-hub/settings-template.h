#ifndef SETTINGS_H
#define SETTINGS_H

// ---- WiFi configuration ----
#define WIFI_SSID "honarro_24"     // The SSID of the WiFi you want your octopus board to connect to.
#define WIFI_PASSWORD "486dxII@66MHZ" // The password of the WiFi you want your octopus board to connect to.

// ---- Things registration properties ----
#define THINGS_NAMESPACE "io.bosch" // The namespace you created in your solution.
#define THING_NAME "kraken"   // Should not be changed - This is the thing id without the namespace.

// ---- Hub registration properties ----
#define HUB_TENANT "t2dd6ec8e610947de864068dee6ff9f9f_hub"          // The tenant id of your hub instance, which is provided by the credentials of the Bosch IoT Suite - service subscriptions page.
#define HUB_DEVICE_ID "io.bosch:kraken"       // The device id that was included in the response of the device provisioning API request.
#define HUB_DEVICE_AUTH_ID "io.bosch_kraken"  // The auth id that was included in the response of the device provisioning API request.
#define HUB_DEVICE_PASSWORD "kraken" // The device password that was used for the device provisioning API request in plain text.

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
