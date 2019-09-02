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
  <div class="card shadow">
    <div class="card-header lead">
      <div class="center-content">
        <div class="col-md-6">
          CONNECTION
          <span v-show="connectionStatus === true" class="badge badge-success">established</span>
        </div>
        <div class="col-md-6 text-right">
          <button class="btn btn-outline-secondary" @click="showData">Collapse</button>
        </div>
      </div>
    </div>
    <div class="card-body" v-show="collapsed">
      <div class="row">
        <div class="col-sm-6">
          <user-data-form></user-data-form>
        </div>
        <div class="col-sm-6">
          <div class="jumbotron" style="height: 100%">
            <p class="lead">Connection info</p>
            <hr class="my-4">
            <p>
              Connection to Server -
              <span
                v-show="connectionStatus === true"
                class="badge badge-success"
              >established</span>
              <span v-show="connectionStatus === false" class="badge badge-danger">error</span>
            </p>
            <p>
              Server sent events -
              <span class="badge badge-info">{{ telemetryCount }}</span>
            </p>
            <button
              @click="initSSE"
              type="button"
              class="btn btn-secondary"
              v-show="connectionStatus && !gettingTelemetry"
            >Receive push updates
            </button>
            <button
              @click="stopSSE"
              type="button"
              class="btn btn-outline-secondary"
              v-show="gettingTelemetry"
            >Stop push updates
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
    import UserDataForm from "./UserDataForm.vue";

    export default {
        name: "UserDataView",

        components: {
            UserDataForm
        },

        data() {
            return {
                gettingTelemetry: false
            };
        },
        computed: {
            connectionStatus: {
                get() {
                    return this.$store.getters.getConnectionStatus;
                }
            },
            telemetryCount: {
                get() {
                    return this.$store.getters.getTelemetryCount;
                }
            },
            collapsed: {
                get() {
                    return this.$store.getters.getUserDataFormCollapsed;
                }
            }
        },
        watch: {
            connectionStatus: function (val) {
                if (val === true) {
                    // Connect to server sent events
                    this.initSSE();
                    this.showData();
                } else {
                    this.stopSSE();
                }
            }
        },
        methods: {
            initSSE() {
                this.gettingTelemetry = true;
                Event.fire("initSSE");
            },
            stopSSE() {
                this.gettingTelemetry = false;
                Event.fire("connectionError");
            },
            showData() {
                this.$store.dispatch("collapseUserDataView", !this.collapsed);
            }

        }
    };
</script>

<style>
  .center-content {
    display: flex;
    align-items: center;
  }
</style>
