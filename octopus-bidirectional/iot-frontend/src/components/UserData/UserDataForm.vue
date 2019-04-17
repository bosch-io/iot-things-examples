<!-- 
/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2018 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 * following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * BOSCH SI PROVIDES THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 */
-->

<template>
  <div>
    <div class="form-group">
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <label class="input-group-text" for="inputGroupSelect01">Platform</label>
        </div>
        <select class="custom-select" id="inputGroupSelect01" @change="onChangePlatform($event)">
          <option value="1" @select="onChangePlatform($event)">Amazon Webservices (AWS)</option>
          <option value="2">Bosch IoT Cloud (BIC)</option>
        </select>
      </div>
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <label class="input-group-text" for="inputGroupSelect02">Authent.</label>
        </div>
        <select
          class="custom-select"
          id="inputGroupSelect02"
          @change="onChangeAuthentication($event)"
        >
          <option value="1" @select="onChangeAuthentication($event)">OAuth2</option>
          <option value="2">BasicAuth</option>
        </select>
      </div>

      <!-- SuiteAuth Form (Default) -->
      <div
        class="m-top-10px"
        v-for="key in Object.keys(connection)"
        :key="key"
        v-show="key !== 'http_endpoint' && key !== 'suiteAuthToken'"
      >
        <div :for="key" v-if="suiteAuthActive" v-show="key !== 'username' && key !== 'password'">
          <label :for="key">
            <small class="grey">
              <i>{{ key }}:</i>
            </small>
          </label>
          <input
            :type="key === 'password' || key === 'client_secret' ? 'password' : 'text'"
            class="form-control"
            :id="key"
            :value="connection[key]"
            @input="setUserData($event)"
          >
        </div>
        <!-- Basic Auth Form -->
        <div :for="key" v-else v-show="key !== 'oAuth2_Token'">
          <label :for="key">
            <small class="grey">
              <i>{{ key }}:</i>
            </small>
          </label>
          <input
            :type="key === 'password' || key === 'client_secret' ? 'password' : 'text'"
            class="form-control"
            :id="key"
            :value="connection[key]"
            @input="setUserData($event)"
          >
        </div>
      </div>
      <!-- Alert Button -->
      <alert-view
        v-if="this.alert.alertId"
        class="m-top-26px"
        :alert="this.alert"
        alert-id="connectionError"
      ></alert-view>

      <!-- Connect Button -->
      <button
        v-show="!connectionStatus"
        class="btn btn-primary m-top-26px"
        @click="connect()"
        :disabled="connectionEmpty"
      >Connect</button>
      <button
        v-show="connectionStatus"
        class="btn btn-sencondary m-top-16px"
        @click="disconnect()"
      >Disconnect</button>
    </div>
  </div>
</template>

<script>
import AlertView from "../shared/AlertView.vue";

export default {
  name: "user-data-form",

  components: {
    AlertView
  },

  data() {
    return {
      connectionEmpty: true,
      alert: {
        alertId: "",
        isError: false
      }
    };
  },

  computed: {
    connection: {
      get() {
        return this.$store.getters.getConnection;
      }
    },
    connectionStatus: {
      get() {
        return this.$store.getters.getConnectionStatus;
      }
    },
    suiteAuthActive: {
      get() {
        return this.$store.getters.getSuiteAuthActive;
      }
    }
  },

  watch: {
    connection: function(val) {
 
      if (
        this.suiteAuthActive &&
        this.connection.api_token != "" &&
        this.connection.oAuth2_Token != ""
      ) {
        this.connectionEmpty = false;
      } else if (
        !this.suiteAuthActive &&
        this.connection.api_token != "" &&
        this.connection.username != "" &&
        this.connection.password != ""
      ) {
        this.connectionEmpty = false;
      } else {
        this.connectionEmpty = true;
      }
    }
  },
  methods: {
    setUserData(event) {
      this.connection[event.target.id] = event.target.value;
      this.$store.commit("setConnectionData", this.connection);
    },

    connect() {
      if (!this.suiteAuthActive) {
        this.$store
          .dispatch("getAllThings")
          .then(res => {
            this.showAlert(res.toString());
          
          })
          .catch(err => console.log(err));
      } else if(this.suiteAuthActive){
      
        this.$store
          .dispatch("getAllThings")
          .then(res => {
            console.log(res);
          })
          .catch(
            err => console.log(err),
            this.showAlert(err)
            );
      }
    },

    disconnect() {
      this.$store.dispatch("disconnect");
    },
    onChangePlatform(event) {
      this.$store.dispatch("setPlatform", event.target.value);
    },
    onChangeAuthentication(event) {
      this.$store.dispatch("setSuiteAuthActive", event.target.value);
      // Clear all Input-Fields by keys
      Object.keys(this.connection).map(key => (this.connection[key] = ""));
      // Set Connection back to empty
      this.connectionEmpty = true;
    },
    showAlert(errMessage) {
      if (errMessage !== "[object Object]") {
        this.alert.alertId = "connectionError";
        this.alert.errorMessage = errMessage;
        this.alert.isError = true;
        setTimeout(() => {
          this.alert.errorMessage = "";
          this.alert.alertId = "";
          this.alert.isError = false;
        }, 5000);
      }
    }
  }
};
</script>

<style>
.m-top-10px {
  margin-top: 10px;
}

.m-top-16px {
  margin-top: 16px;
}

.m-top-26px {
  margin-top: 26px;
}

.grey {
  color: grey;
}

.input-group mb-3 {
  margin: 10px 0 0 10px;
  width: 100%;
  float: left;
}
</style>