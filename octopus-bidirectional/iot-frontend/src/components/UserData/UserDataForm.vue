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
      <div
        class="m-top-10px"
        v-for="key in Object.keys(connection)"
        :key="key"
        v-show="key !== 'http_endpoint' && key !== 'solution_id'"
      >
        <label :for="key">
          <small class="grey">
            <i>{{ key }}:</i>
          </small>
        </label>
        <input
          :type="key === 'password' ? 'password' : 'text'"
          class="form-control"
          :id="key"
          :value="connection[key]"
          @input="setUserData($event)"
        >
      </div>
      <button
        v-show="!connectionStatus"
        class="btn btn-primary m-top-16px"
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
export default {
  name: "user-data-form",

  data() {
    return {
      connectionEmpty: true
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
    }
  },

  watch: {
    connection: function(val) {
      let isOneEmpty = Object.keys(this.connection).map(
        key => this.connection[key] === ""
      );
      this.connectionEmpty = isOneEmpty.includes(true);
    }
  },

  methods: {
    setUserData(event) {
      this.connection[event.target.id] = event.target.value;
      this.$store.commit("setConnectionData", this.connection);
    },
    connect() {
      this.$store.dispatch("getAllThings");
    },
    disconnect() {
      this.$store.dispatch("disconnect");
    }
  }
};
</script>

<style>
.m-top-10px {
  margin-top: 10px;
}

.m-top-16px {
  margin-top: 26px;
}

.grey {
  color: grey;
}
</style>