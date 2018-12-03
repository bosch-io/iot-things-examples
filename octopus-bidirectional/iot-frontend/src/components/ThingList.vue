/* eslint-disable */

<template>
  <div class="list-group shadow">
    <a
      v-bind:key="item.thingId"
      v-for="item in items"
      @click="select(item, $event)"
      href="#/"
      :class="item.thingId === isActiveId ? cssIsActive : cssIsNotActive"
    >
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">{{ item.thingId }}</h5>
        <!-- <small>{{ item.policyId }}</small> -->
      </div>
       <p class="mb-1 pl-3">rev: {{ item['_revision'] || '' }}</p>
    </a>
    <!--<div class="list-group-item disabled-list-item">-->
      <!--<div>-->
        <!--<a @click="select('newThing', $event)" class="lead">-->
          <!--<font-awesome-icon style="margin-right: 5px;" icon="plus"/>-->
          <!--<i>Create new thing</i>-->
        <!--</a>-->
      <!--</div>-->
    <!--</div>-->
  </div>
</template>

<script>
export default {
  name: "ThingList",
  data() {
    return {
      cssIsActive:
        "list-group-item list-group-item-action flex-column align-items-start active",
      cssIsNotActive:
        "list-group-item list-group-item-action flex-column align-items-start",
      isActiveId: ""
    };
  },
  methods: {
    select(thing) {
      if (thing === "newThing") thing = this.createNewThingTemplate();
      this.$store.dispatch("handleSelected", thing).then(res => {
        if (res.status == 200) {
          this.isActiveId = thing.thingId;
        }
      });
    },
    // Unused for now:
    createNewThingTemplate() {
      let namespace = this.userdata.filter(object => {
        return object.key == "namespace";
      })[0].value;
      let template = `{"thingId": "${namespace}:<newThing>", "policyId": "${namespace}:<policy>", "features": {
		"acceleration": {
			"definition": [
				"com.ipso.smartobjects:Accelerometer:1.1.0"
			],
			"properties": {}
		},
		"ambient_temperature": {
			"definition": [
				"com.ipso.smartobjects:Temperature:1.1.0"
			],
			"properties": {}
		},
		"orientation": {
			"definition": [
				"com.ipso.smartobjects:Multiple_Axis_Joystick:1.1.0"
			],
			"properties": {}
		},
		"linear_acceleration": {
			"definition": [
				"com.ipso.smartobjects:Accelerometer:1.1.0"
			],
			"properties": {}
		},
		"gravity": {
			"definition": [
				"com.ipso.smartobjects:Accelerometer:1.1.0"
			],
			"properties": {}
		},
		"magnetometer": {
			"definition": [
				"com.ipso.smartobjects:Magnetometer:1.1.0"
			],
			"properties": {}
		},
		"temperature": {
			"definition": [
				"com.ipso.smartobjects:Temperature:1.1.0"
			],
			"properties": {}
		},
		"humidity": {
			"definition": [
				"com.ipso.smartobjects:Humidity:1.1.0"
			],
			"properties": {}
		},
		"gas_resistance": {
			"definition": [
				"com.ipso.smartobjects:Generic_Sensor:1.1.0"
			],
			"properties": {}
		},
		"pressure": {
			"definition": [
				"com.ipso.smartobjects:Barometer:1.1.0"
			],
			"properties": {}
		},
		,
		"altitude": {
			"definition": [
				"com.ipso.smartobjects:Altitude:1.1.0"
			],
			"properties": {}
		}
		"angular_velocity": {
			"definition": [
				"com.ipso.smartobjects:Gyrometer:1.1.0"
			],
			"properties": {}
		},
		"voltage": {
			"definition": [
				"com.ipso.smartobjects:Voltage:1.1.0"
			],
			"properties": {}
		}
	}}`;
      return JSON.parse(template);
    }
  },
  computed: {
    items: {
      get() {
        return this.$store.getters.getItems;
      }
    },
    userdata: {
      get() {
        return this.$store.getters.getUserData;
      }
    }
  }
};
</script>

<style>
</style>
