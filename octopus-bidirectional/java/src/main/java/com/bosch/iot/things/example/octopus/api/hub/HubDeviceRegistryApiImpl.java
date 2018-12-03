/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2017 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
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
package com.bosch.iot.things.example.octopus.api.hub;

import static com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryInformation.CREDENTIALS_URL;
import static com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryInformation.PASSWORD;
import static com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryInformation.REGISTRATION_URL;
import static com.bosch.iot.things.example.octopus.api.hub.HubDeviceRegistryInformation.USERNAME;
import static com.bosch.iot.things.example.octopus.utils.HttpUtils.AUTHORIZATION_HEADER_NAME;
import static com.bosch.iot.things.example.octopus.utils.HttpUtils.buildBasicAuthHeaderValue;

import java.util.concurrent.TimeUnit;

import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.Request;
import org.eclipse.ditto.json.JsonObject;

import com.bosch.iot.things.example.octopus.utils.FutureUtils;
import com.bosch.iot.things.example.octopus.utils.HttpUtils;
import com.bosch.iot.things.example.octopus.utils.ResponseHandlerFactory;


public class HubDeviceRegistryApiImpl implements HubDeviceRegistryApi {

    @Override
    public void addDeviceRegistration(final JsonObject device) {
        add(REGISTRATION_URL, device);
    }

    @Override
    public void addDeviceCredentials(final JsonObject credentials) {
        add(CREDENTIALS_URL, credentials);
    }

    @Override
    public void deleteDeviceRegistration(final String deviceId) {
        delete(REGISTRATION_URL + "/" + deviceId);
    }

    @Override
    public void deleteDeviceCredentials(final String deviceId, final String authId) {
        delete(CREDENTIALS_URL + "?device-id=" + deviceId + "&auth-id=" + authId + "&type=hashed-password");
    }

    private void add(final String url, final JsonObject entity) {
        final AsyncHttpClient httpClient = HttpUtils.getConfiguredHttpClient();
        final Request request = httpClient.preparePost(url)
                .setHeader(HttpUtils.CONTENT_TYPE_HEADER_NAME, HttpUtils.APPLICATION_JSON_CONTENT_TYPE)
                .setHeader(AUTHORIZATION_HEADER_NAME,
                        buildBasicAuthHeaderValue(USERNAME, PASSWORD))
                .setBody(entity.toString())
                .build();

        FutureUtils.get(httpClient.executeRequest(request, ResponseHandlerFactory.defaultResponseHandler()),
                HttpUtils.REQUEST_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS);
    }

    private void delete(final String url) {
        final AsyncHttpClient httpClient = HttpUtils.getConfiguredHttpClient();
        final Request request = httpClient.prepareDelete(url)
                .setHeader(AUTHORIZATION_HEADER_NAME,
                        buildBasicAuthHeaderValue(USERNAME, PASSWORD))
                .build();

        FutureUtils.get(httpClient.executeRequest(request, ResponseHandlerFactory.deleteResponseHandler()),
                HttpUtils.REQUEST_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS);
    }
}
