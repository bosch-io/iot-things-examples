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

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpStatus;
import org.apache.oltu.oauth2.client.OAuthClient;
import org.apache.oltu.oauth2.client.URLConnectionClient;
import org.apache.oltu.oauth2.client.request.OAuthClientRequest;
import org.apache.oltu.oauth2.client.response.OAuthAuthzResponse;
import org.apache.oltu.oauth2.client.response.OAuthJSONAccessTokenResponse;
import org.apache.oltu.oauth2.common.exception.OAuthProblemException;
import org.apache.oltu.oauth2.common.exception.OAuthSystemException;
import org.apache.oltu.oauth2.common.message.types.GrantType;

import com.bosch.cr.examples.jwt.ConfigurationProperties;
import com.bosch.cr.examples.jwt.ConfigurationProperty;

/**
 * Servlet which handles callbacks from google during oauth flow. You have to register
 * https://your.domain/jwt-authentication/oauth2callback/google as callback uri in your google account.
 */
@WebServlet("/oauth2callback/google")
public class GoogleCallbackServlet extends HttpServlet {

    private static final long serialVersionUID = 1207454571295364520L;

    private static final String GOOGLE_OAUTH2_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token";
    private static final String ID_TOKEN_PROPERTY = "id_token";
    private static final String REDIRECT_URL = "../index.html";

    private ConfigurationProperties configurationProperties;

    @Override
    public void init() throws ServletException {
        super.init();

        configurationProperties = ConfigurationProperties.getInstance();
    }

    @Override
    protected void doGet(final HttpServletRequest req, final HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            final String code = OAuthAuthzResponse.oauthCodeAuthzResponse(req).getCode();
            final String idToken = getIdToken(code);

            final boolean secure = configurationProperties.getPropertyAsBoolean(ConfigurationProperty.SECURE_COOKIE);
            final int maxAge = -1; // cookie is deleted when browser is closed
            final Cookie cookie = CookieUtil.getJwtAuthenticationCookie(idToken, secure, maxAge);

            resp.addCookie(cookie);
            resp.sendRedirect(REDIRECT_URL);
        } catch (final OAuthProblemException | OAuthSystemException e) {
            resp.setStatus(HttpStatus.SC_UNAUTHORIZED);
            resp.getOutputStream().print(e.getMessage());
            throw new RuntimeException(e);
        }
    }

    private String getIdToken(final String code) throws OAuthSystemException, OAuthProblemException {
        final String clientId = configurationProperties.getPropertyAsString(ConfigurationProperty.GOOGLE_CLIENT_ID);
        final String clientSecret =
                configurationProperties.getPropertyAsString(ConfigurationProperty.GOOGLE_CLIENT_SECRET);
        final String redirectUrl =
                configurationProperties.getPropertyAsString(ConfigurationProperty.GOOGLE_CLIENT_REDIRECT_URL);

        final OAuthClientRequest request = OAuthClientRequest //
                .tokenLocation(GOOGLE_OAUTH2_TOKEN_URL) //
                .setGrantType(GrantType.AUTHORIZATION_CODE) //
                .setClientId(clientId) //
                .setClientSecret(clientSecret) //
                .setRedirectURI(redirectUrl) //
                .setCode(code) //
                .buildBodyMessage();

        final OAuthClient oAuthClient = new OAuthClient(new URLConnectionClient());
        final OAuthJSONAccessTokenResponse accessTokenResponse =
                oAuthClient.accessToken(request, OAuthJSONAccessTokenResponse.class);
        return accessTokenResponse.getParam(ID_TOKEN_PROPERTY);
    }
}
