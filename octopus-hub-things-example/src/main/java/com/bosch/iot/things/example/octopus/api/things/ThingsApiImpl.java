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
package com.bosch.iot.things.example.octopus.api.things;


import static com.bosch.iot.things.example.octopus.api.permissions.PermissionsUserInformation.PASSWORD;
import static com.bosch.iot.things.example.octopus.api.permissions.PermissionsUserInformation.USERNAME;
import static com.bosch.iot.things.example.octopus.utils.HttpUtils.buildBasicAuthHeaderValue;

import java.text.MessageFormat;
import java.util.concurrent.TimeUnit;

import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.Request;
import org.eclipse.ditto.json.JsonObject;
import org.eclipse.ditto.json.JsonPointer;
import org.eclipse.ditto.model.policies.PoliciesModelFactory;
import org.eclipse.ditto.model.policies.Policy;
import org.eclipse.ditto.model.things.Thing;
import org.eclipse.ditto.model.things.ThingsModelFactory;

import com.bosch.iot.things.example.octopus.utils.FutureUtils;
import com.bosch.iot.things.example.octopus.utils.HttpUtils;
import com.bosch.iot.things.example.octopus.utils.ResponseHandlerFactory;


public class ThingsApiImpl implements ThingsApi {

    private static final String API_TOKEN_HEADER_NAME = "x-cr-api-token";
    private static final String API_URL = "https://things.s-apps.de1.bosch-iot-cloud.com/api/2";
    private static final String POLICIES_URL = API_URL + "/policies";
    private static final String THINGS_URL = API_URL + "/things";

    @Override
    public Policy registerPolicy(final Policy policy) {
        final String policyId = policy.getId()
                .orElseThrow(() -> {
                    final String msgPattern = "Mandatory field <{0}> is missing!";
                    return new IllegalArgumentException(
                            MessageFormat.format(msgPattern, Policy.JsonFields.ID.getPointer()));
                });
        final JsonObject ownerSubject = JsonObject.newBuilder()
                .set("${request.subjectId}",
                        JsonObject.newBuilder().set("type", "iot-permissions-userid").build())
                .build();

        final JsonObject jsonPolicy = policy.toJson()
                .setValue(JsonPointer.of("/entries/owner/subjects"), ownerSubject);

        final JsonObject createdPolicy = register(POLICIES_URL, jsonPolicy, policyId);

        return PoliciesModelFactory.newPolicy(createdPolicy);
    }

    @Override
    public void deletePolicy(final String policyId) {
        delete(POLICIES_URL, policyId);
    }

    @Override
    public Thing registerThing(final Thing thing) {
        final JsonObject createdThing = register(THINGS_URL, thing.toJson(), thing.getId()
                .orElseThrow(() -> {
                    final String msgPattern = "Mandatory field <{0}> is missing!";
                    return new IllegalArgumentException(
                            MessageFormat.format(msgPattern, Thing.JsonFields.ID.getPointer()));
                }));

        return ThingsModelFactory.newThing(createdThing);
    }

    @Override
    public void deleteThing(final String thingId) {
        delete(THINGS_URL, thingId);
    }

    @Override
    public JsonObject getThing(final String thingId) {
        final AsyncHttpClient httpClient = HttpUtils.getConfiguredHttpClient();
        final Request request = httpClient.prepareGet(THINGS_URL + "/" + thingId)
                .setHeader(API_TOKEN_HEADER_NAME, SolutionInformation.API_TOKEN)
                .setHeader(HttpUtils.AUTHORIZATION_HEADER_NAME,
                        buildBasicAuthHeaderValue(USERNAME, PASSWORD))
                .build();

        return FutureUtils.get(httpClient.executeRequest(request, ResponseHandlerFactory.defaultResponseHandler()),
                HttpUtils.REQUEST_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS);
    }

    private JsonObject register(final String baseUrl, final JsonObject entityToRegister, final String entityId) {
        final AsyncHttpClient httpClient = HttpUtils.getConfiguredHttpClient();
        final Request request = httpClient.preparePut(baseUrl + "/" + entityId)
                .setHeader(HttpUtils.CONTENT_TYPE_HEADER_NAME, HttpUtils.APPLICATION_JSON_CONTENT_TYPE)
                .setHeader(API_TOKEN_HEADER_NAME, SolutionInformation.API_TOKEN)
                .setHeader(HttpUtils.AUTHORIZATION_HEADER_NAME,
                        buildBasicAuthHeaderValue(USERNAME, PASSWORD))
                .setBody(entityToRegister.toString())
                .build();

        return FutureUtils.get(httpClient.executeRequest(request, ResponseHandlerFactory.defaultResponseHandler()),
                HttpUtils.REQUEST_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS);
    }

    private void delete(final String baseUrl, final String entityId) {

        final AsyncHttpClient httpClient = HttpUtils.getConfiguredHttpClient();
        final Request request = httpClient.prepareDelete(baseUrl + "/" + entityId)
                .setHeader(API_TOKEN_HEADER_NAME, SolutionInformation.API_TOKEN)
                .setHeader(HttpUtils.AUTHORIZATION_HEADER_NAME,
                        buildBasicAuthHeaderValue(USERNAME, PASSWORD))
                .build();

        FutureUtils.get(httpClient.executeRequest(request, ResponseHandlerFactory.deleteResponseHandler()),
                HttpUtils.REQUEST_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS);
    }
}
