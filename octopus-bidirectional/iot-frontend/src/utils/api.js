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
import axios from "axios";
import store from "../store";

export default (window.Api = new class {
    constructor() {
        this.vue = new Vue({
                               name: "api",
                               store,
                               computed: {
                                   platform: {
                                       get() {
                                           return this.$store.getters.getPlatform;
                                       }
                                   },
                                   bearerToken: {
                                       get() {
                                           return this.$store.getters.getBearerToken;
                                       }
                                   },
                                   selected: {
                                       get() {
                                           return this.$store.getters.getSelected;
                                       }
                                   }
                               }
                           });

        this.routes = {
            policies:
                `${this.vue.platform}/api/2/policies`,
            searchThings:
                `${this.vue.platform}/api/2/search/things?&fields=thingId,policyId,attributes,features,_revision,_modified`,
            things: `${this.vue.platform}/api/2/things`,
            messages:
                `${this.vue.platform}/api/2/things/${this.vue.selected.thingId}`
        };
    }

    getConfig = (correlationId = null) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.vue.bearerToken}`
        };
        if (correlationId) {
            headers['x-correlation-id'] = correlationId;
        }
        return { headers };
    };

    getAllThings = () => {
        return axios.get(
            `${this.vue.platform}/api/2/search/things?&fields=thingId,policyId,attributes,features,_revision,_modified`,
            this.getConfig()
        );
    };

    sendMessage = (message, topic, corrId) => {
        return axios.post(
            `${this.vue.platform}/api/2/things/${this.vue.selected.thingId}/inbox/messages/${topic}`,
            `${JSON.stringify(message)}`,
            this.getConfig(corrId)
        );
    };
}());
