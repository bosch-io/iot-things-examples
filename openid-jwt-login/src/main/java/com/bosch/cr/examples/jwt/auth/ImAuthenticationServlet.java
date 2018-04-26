/*
 * Bosch SI Example Code License Version 1.0, January 2016
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
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE
 * QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL
 * NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH BOSCH
 * SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT LIMITATION FOR
 * INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF THE GERMAN
 * PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN UNAFFECTED
 * BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF LIABILITY
 * ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S EMPLOYEES,
 * REPRESENTATIVES AND ORGANS.
 */
package com.bosch.cr.examples.jwt.auth;

import java.io.IOException;
import java.util.stream.Collectors;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.bosch.im.api2.dto.AuthenticationResponseDto;
import com.bosch.im.api2.dto.AuthorizationResponseDto;
import org.apache.http.HttpStatus;

import com.bosch.cr.examples.jwt.ConfigurationProperties;
import com.bosch.cr.examples.jwt.ConfigurationProperty;
import com.bosch.cr.json.JsonFactory;
import com.bosch.cr.json.JsonFieldDefinition;
import com.bosch.cr.json.JsonMissingFieldException;
import com.bosch.cr.json.JsonObject;
import com.bosch.cr.json.JsonValue;
import com.bosch.im.api2.client.IClient;
import com.bosch.im.api2.client.builder.IClientBuilder;
import com.bosch.im.api2.client.impl.client.ClientBuilder;

/**
 * @since 1.0.0
 */
@WebServlet("/authentication")
public class ImAuthenticationServlet extends HttpServlet {

    private static final long serialVersionUID = -7950748455165245489L;

    private static final JsonFieldDefinition TENANT_NAME_OR_ID =
            JsonFactory.newFieldDefinition("tenantNameOrId", String.class);

    private static final JsonFieldDefinition USERNAME = JsonFactory.newFieldDefinition("userName", String.class);

    private static final JsonFieldDefinition PASSWORD = JsonFactory.newFieldDefinition("password", String.class);

    private ConfigurationProperties configurationProperties;
    private ImAuthenticationHelper authenticationHelper;

    @Override
    public void init(final ServletConfig config) throws ServletException {
        super.init(config);

        configurationProperties = ConfigurationProperties.getInstance();

        final boolean proxyEnabled = configurationProperties.getPropertyAsBoolean(ConfigurationProperty.PROXY_ENABLED);
        final String proxyHost = configurationProperties.getPropertyAsString(ConfigurationProperty.PROXY_HOST);
        final String proxyPort = configurationProperties.getPropertyAsString(ConfigurationProperty.PROXY_PORT);
        if (proxyEnabled) {
            System.setProperty(ConfigurationProperty.PROXY_HOST.getName(), proxyHost);
            System.setProperty(ConfigurationProperty.PROXY_PORT.getName(), proxyPort);
        }

        final String clientId = configurationProperties.getPropertyAsString(ConfigurationProperty.IM_CLIENT_ID);
        final String clientSecret = configurationProperties.getPropertyAsString(ConfigurationProperty.IM_CLIENT_SECRET);
        final String url = configurationProperties.getPropertyAsString(ConfigurationProperty.IM_URL);

        final IClient client = new ClientBuilder()
                .clientId(clientId)
                .clientSecret(clientSecret)
                .serviceUrl(url)
                .build();



        authenticationHelper = new ImAuthenticationHelper(client);
    }

    @Override
    protected void doPost(final HttpServletRequest req, final HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            final String body = req.getReader().lines().collect(Collectors.joining());

            final JsonObject jsonObject = JsonFactory.newObject(body);

            final String tenantNameOrId = jsonObject.getValue(TENANT_NAME_OR_ID).map(JsonValue::asString)
                    .orElse(configurationProperties.getPropertyAsString(ConfigurationProperty.IM_DEFAULT_TENANT));

            final String userName = jsonObject.getValue(USERNAME).map(JsonValue::asString)
                    .orElseThrow(() -> new JsonMissingFieldException(USERNAME.getPointer()));

            final String password = jsonObject.getValue(PASSWORD).map(JsonValue::asString)
                    .orElseThrow(() -> new JsonMissingFieldException(PASSWORD.getPointer()));

            final AuthenticationResponseDto authenticationDto =
                    authenticationHelper.authenticate(tenantNameOrId, userName, password);
            final AuthorizationResponseDto authorizationDto = authenticationHelper.authorize(authenticationDto);
            final String authorizationToken = authorizationDto.getAuthorizationToken();

            final boolean secure = configurationProperties.getPropertyAsBoolean(ConfigurationProperty.SECURE_COOKIE);
            final int maxAge = -1; // cookie is deleted when browser is closed
            final Cookie cookie = CookieUtil.getJwtAuthenticationCookie(authorizationToken, secure, maxAge);

            resp.addCookie(cookie);
            resp.setStatus(HttpStatus.SC_NO_CONTENT);
        } catch (final IOException e) {
            resp.setStatus(HttpStatus.SC_INTERNAL_SERVER_ERROR);
        } catch (final JsonMissingFieldException e) {
            resp.setStatus(HttpStatus.SC_BAD_REQUEST);
            resp.getOutputStream().print(e.getMessage());
        } catch (final Exception e) {
            resp.setStatus(HttpStatus.SC_UNAUTHORIZED);
            resp.getOutputStream().print(e.getMessage());
        }
    }

    @Override
    protected void doDelete(final HttpServletRequest req, final HttpServletResponse resp)
            throws ServletException, IOException {
        final Cookie cookie = CookieUtil.getJwtAuthenticationCookie("invalid", false, 0);
        resp.addCookie(cookie);
        resp.setStatus(HttpStatus.SC_NO_CONTENT);
    }
}
