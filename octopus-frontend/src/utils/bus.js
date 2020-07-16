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

import Vue from "vue";
import {EventSourcePolyfill} from "event-source-polyfill";
import store from "../store";
import Api from "./api.js";

export default (window.Event = new class {
    constructor() {
        this.vue = new Vue({
                               name: "eventbus",
                               store,
                               computed: {
                                   platform: {
                                       get() {
                                           return this.$store.getters.getPlatform;
                                       }
                                   },
                                   selected: {
                                       get() {
                                           return this.$store.getters.getSelected;
                                       }
                                   },
                                   items: {
                                       get() {
                                           return this.$store.getters.getItems;
                                       }
                                   }
                               }
                           });
        this.source = null;
    }

    fire(event, data = null) {
        if (event === "initSSE") {
            // start listening with a little timeout
            let values = Object.values(this.vue.items);
            let thingIds = values.map(element => element.thingId).join(",");
            this.source = new EventSourcePolyfill(
              `${
                this.vue.platform
              }/api/2/things?ids=${thingIds}&fields=thingId,policyId,attributes,features,_revision`,
              {
                  headers: {
                      Authorization: Api.getConfig().headers.Authorization
                  },
                  withCredentials: true
              }
            );
            this.source.onmessage = sse => {
                if (sse.data && sse.data.length > 0) {
                    this.vue.$store.commit("incrementTelemetryCount");
                    this.vue.$store.dispatch("telemetryUpdate", sse.data);
                }
            };
        } else if (event === "connectionError") {
            this.source.close();
        } else {
            this.vue.$emit(event, data);
        }
    }

    listen(event, callback) {
        this.vue.$on(event, callback);
    }
}());
