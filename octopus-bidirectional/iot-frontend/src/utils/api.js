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

/* eslint-disable */

import Vue from "vue";
import store from "../store";
import axios from "axios";
import qs from "qs";

export default (window.Api = new class {
  constructor() {
    this.vue = new Vue({
                         name: "api",
                         store,
                         computed: {
                           connection: {
                             get() {
                               return this.$store.getters.getConnection;
                             }
                           },
                           selected: {
                             get() {
                               return this.$store.getters.getSelected;
                             }
                           },
                           suiteAuthHost: {
                             get() {
                               return this.$store.getters.getSuiteAuthHost;
                             }

                           }
                         }
                       });

    this.routes = {
      policies:
        this.vue.connection.http_endpoint + "/api/2" + "/policies",
      searchThings:
        this.vue.connection.http_endpoint + "/api/2" +
        "/search/things?&fields=thingId,policyId,attributes,features,_revision,_modified",
      things: this.vue.connection.http_endpoint + "/api/2" + "/things",
      messages:
        this.vue.connection.http_endpoint +
        "/api/2" +
        "/things/" +
        this.vue.selected.thingId
    };
  }

  createAuthHeader = (username, password) => {
    return (
      "Basic " +
      btoa(
        encodeURIComponent(username + ":" + password).replace(
          /%([0-9A-F]{2})/g,
          function toSolidBytes(match, p1) {
            return String.fromCharCode("0x" + p1);
          }
        )
      )
    );
  };

  getConfig = (additionalHeader = null) => {
    if (additionalHeader) {
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: this.createAuthHeader(
            this.vue.connection.username,
            this.vue.connection.password
          ),
          "x-cr-api-token": this.vue.connection.api_token,
          "x-correlation-id": additionalHeader
        }
      };
    }
    if (!additionalHeader && !this.vue.connection.suiteAuthActive) {
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: this.createAuthHeader(
            this.vue.connection.username,
            this.vue.connection.password
          ),
          "x-cr-api-token": this.vue.connection.api_token
        }
      };
    }
    if (this.vue.connection.suiteAuthActive) {
      return {
        // TODO - Call Things with SuiteAuthActive
      }
    }
  };


  getAllThings = () => {
    return axios.get(
      `${
        this.vue.connection.http_endpoint
        }/api/2/search/things?&fields=thingId,policyId,attributes,features,_revision,_modified`,
      this.getConfig()
    );
  };


  getJWTToken = () => {
    var bodyFormData = new FormData();

    bodyFormData.set('grant_type', 'client_credentials');
    bodyFormData.set('client_id', this.vue.connection.client_id);
    bodyFormData.set('client_secret', this.vue.connection.client_secret);
    bodyFormData.set('scope', this.vue.connection.scope);

    const data = {
      'grant_type': 'client_credentials',
      'client_id': this.vue.connection.client_id,
      'client_secret': this.vue.connection.client_secret,
      'scope': this.vue.connection.scope
    }

    const dataString = qs.stringify(data);

    return axios({
            method: 'post',
            url: this.vue.suiteAuthHost,
            data: dataString,
            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
          })
  };


  sendMessage = (message, topic, corrId) => {
    return axios.post(
      `${this.vue.connection.http_endpoint}/api/2/things/${
        this.vue.selected.thingId
        }/inbox/messages/${topic}`,
      `${JSON.stringify(message)}`,
      this.getConfig(corrId)
    );
  };
}());
