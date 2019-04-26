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
  <div v-if="isReady" class="card shadow m-bottom-24px">
    <div class="card-body lead" v-show="!isReady">No thing selected</div>
    <div v-show="isReady">
      <div class="card-header lead">{{ items[isSelected.thingId].thingId }}</div>
      <codemirror
        id="thing"
        :options="cmOptions"
        :value="JSON.stringify(items[isSelected.thingId], null, '\t')"
        class="border-bottom"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view :alert="this.alert" alert-id="saveChanges"></alert-view>
          </div>
          <div class="row">
            <span class="lead">Command & Control</span>
          </div>
        </div>
      </div>
      <codemirror
        id="sendMessage"
        :options="cmOptions"
        :value="JSON.stringify(message, null, '\t')"
        @input="updateMessage($event)"
        class="border-bottom border-top"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view class="middle-out" :alert="this.alert" alert-id="sendMessage"></alert-view>
          </div>
          <div class="row" style="margin-bottom: 18px;">
            <button
              id="sendButton"
              @click="sendMessage"
              type="button"
              class="btn btn-outline-primary col middle-out"
              :disabled="isSending"
            >
              <font-awesome-icon style="margin-right: 5px;" icon="upload"/>Send message
            </button>
          </div>

          <div class="row">
            <div class="input-group col">
              <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Topic</span>
              </div>
              <input class="form-control" type="text" placeholder="topic" v-model="topic">
            </div>
            <div class="input-group col">
              <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Cor-Id</span>
              </div>
              <input
                class="form-control"
                type="text"
                placeholder="Correlation id"
                v-model="correlation"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { codemirror } from "vue-codemirror";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/addon/selection/active-line.js";
import AlertView from "./shared/AlertView.vue";
import UserDataViewVue from './UserData/UserDataView.vue';

export default {
  name: "ModifyThing",
  components: {
    codemirror,
    AlertView
  },
  data() {
    return {
      isReady: false,
      isSending: false,
      localcopy: {},
      cmOptions: {
        theme: "idea",
        tabSize: 2,
        mode: "application/json",
        lineNumbers: true,
        matchBrackets: true,
        line: false,
        lines: 1,
        lineWrapping: true
      },
      alert: {
        alertId: "",
        isSuccess: false,
        isError: false,
        successMessage: "",
        errorMessage: ""
      },
      message: {
        r: 0,
        g: 0,
        b: 0,
        w: 0
      },
      topic: "switch_led",
      correlation: "message-example"
    };
  },
  computed: {
    isSelected: {
      get() {
        return this.$store.getters.getSelected;
      },
      set(value) {
        this.$store.commit("setSelected", value);
      }
    },
    items: {
      get() {
        return this.$store.getters.getItems;
      }
    },
    isConnected: {
      get() {
        return this.$store.getters.getConnectionStatus;
      }
    }
  },
  watch: {
    isSelected: function(val) {
      this.isReady = true;
    },
    isConnected: function(val) {
      if (!val) {
        this.isReady = false;
      }
    }
  },
  methods: {
    updateMessage(event) {
      try {
        this.isSending = false;
        this.message = JSON.parse(event);
      } catch (e) {
        if (e) {
          this.isSending = true;
          this.showAlert(false, "sendMessage", "JSON not valid");
        }
      }
    },
    sendMessage() {
      this.isSending = true;
      this.$store
        .dispatch("sendMessage", {
          message: this.message,
          topic: this.topic,
          corrId: this.correlation
        })
        .then(res => {
          this.showAlert(
            true,
            "sendMessage",
            `Response: ${JSON.stringify(res.data)}`
          );
          this.isSending = false;

        })
        .catch(err => {

        //  console.log('KOMPLETT NICHT ACCEPTED: ', err);

          this.isSending = false;
          this.showAlert(false, "sendMessage", err.message);
          

        });
    },
    showAlert(isOkay, alertId, alertMessage) {
      this.alert.alertId = alertId;
      if (isOkay) {
        this.alert.isSuccess = true;
        this.alert.successMessage = alertMessage;
      } else {
        this.alert.isError = true;
        this.alert.errorMessage = alertMessage;
      }
      setTimeout(() => {
        this.alert.alertId = "";
        this.alert.isSuccess = false;
        this.alert.isError = false;
        this.alert.successMessage = "";
        this.alert.errorMessage = "";
      }, 5000);
    }
  }
};
</script>

<style>
.CodeMirror {
  height: 600px;
}

#sendMessage .CodeMirror {
  height: 160px;
}

.m-bottom-24px {
  margin-bottom: 24px;
}

.middle-out {
  margin-right: 15px;
  margin-left: 15px;
}
</style>
