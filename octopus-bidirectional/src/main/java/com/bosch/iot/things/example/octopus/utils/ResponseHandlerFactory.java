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
package com.bosch.iot.things.example.octopus.utils;

import org.asynchttpclient.AsyncCompletionHandler;
import org.asynchttpclient.Response;
import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonObject;

public class ResponseHandlerFactory {

    private ResponseHandlerFactory() {}

    public static AsyncCompletionHandler<JsonObject> defaultResponseHandler() {

        return new AsyncCompletionHandler<JsonObject>() {

            @Override
            public JsonObject onCompleted(final Response response) {
                final int status = response.getStatusCode();
                final String responseBody = getResponseBody(response);
                if (isSuccess(status)) {
                    return JsonFactory.newObject(responseBody);
                } else {
                    throw createUnexpectedResponseException(status, responseBody);
                }
            }

            @Override
            public void onThrowable(final Throwable t) {
                throw new IllegalStateException(t);
            }
        };
    }

    public static AsyncCompletionHandler<Void> deleteResponseHandler() {

        return new AsyncCompletionHandler<Void>() {

            @Override
            public Void onCompleted(final Response response) {
                int status = response.getStatusCode();
                final String responseBody = getResponseBody(response);
                if (isSuccess(status) || status == 404 || status == 403) {
                    return null;
                } else {
                    throw createUnexpectedResponseException(status, responseBody);
                }
            }

            @Override
            public void onThrowable(final Throwable t) {
                throw new IllegalStateException(t);
            }
        };
    }

    private static RuntimeException createUnexpectedResponseException(final int status, final String responseBody) {
        final String message =
                "Unexpected response status: " + status + ". " + responseBody;
        return new IllegalStateException(message);
    }

    private static String getResponseBody(final Response response) {
        final String responseBody = response.getResponseBody();
        return responseBody.isEmpty() ? "{}" : responseBody;
    }

    private static boolean isSuccess(final int statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }
}
