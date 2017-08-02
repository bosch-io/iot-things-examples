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
package com.bosch.cr.examples.jwt;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHeaders;
import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.params.HttpParams;
import org.apache.http.ssl.SSLContextBuilder;
import org.mitre.dsmiley.httpproxy.ProxyServlet;

import com.bosch.cr.examples.jwt.auth.CookieUtil;
import com.bosch.cr.examples.jwt.auth.GoogleCallbackServlet;
import com.bosch.cr.examples.jwt.auth.ImAuthenticationServlet;

/**
 * ProxyServlet to forward all requests to target service required as replacement for for cross domain requests.
 */
@WebServlet("/api/*")
public class CustomProxyServlet extends ProxyServlet {

    private static final long serialVersionUID = -1029323114335880228L;

    private static final String X_CR_API_TOKEN_HTTP_HEADER = "x-cr-api-token";

    private CloseableHttpClient httpClient;
    private ConfigurationProperties configurationProperties;

    @Override
    public void init(ServletConfig config) throws ServletException {
        configurationProperties = ConfigurationProperties.getInstance();
        System.out.print(configurationProperties);
        super.init(config);
    }

    @Override
    protected void service(final HttpServletRequest req, final HttpServletResponse resp)
            throws ServletException, IOException {
        final Optional<Cookie[]> cookies = Optional.ofNullable(req.getCookies());

        if (cookies.isPresent()) {
            final Optional<Cookie> authorizationCookie = Stream.of(cookies.get()) //
                    .filter(CookieUtil::isJwtAuthenticationCookie) //
                    .findFirst();

            if (authorizationCookie.isPresent()) {
                super.service(req, resp);
                return;
            }
        }

        resp.setStatus(HttpStatus.SC_UNAUTHORIZED);
    }

    /**
     * Adds the {@code x-cr-api-token} and {@code Authorization} header to the {@code proxyRequest}. Authorization is
     * set only if an authorization cookie containing a JWT is present on the {@code request}. The JWT cookie is set on
     * login and send back to the browser.
     *
     * @param request the request.
     * @param proxyRequest the proxy request.
     * @see ImAuthenticationServlet
     * @see GoogleCallbackServlet
     */
    @Override
    protected void copyRequestHeaders(final HttpServletRequest request, final HttpRequest proxyRequest) {
        super.copyRequestHeaders(request, proxyRequest);

        final Optional<Cookie> authorizationCookie = Stream.of(request.getCookies()) //
                .filter(CookieUtil::isJwtAuthenticationCookie) //
                .findFirst();

        if (authorizationCookie.isPresent()) {
            // add authorization if cookie is present
            proxyRequest.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + authorizationCookie.get().getValue());
        }

        // add api token
        proxyRequest.addHeader(X_CR_API_TOKEN_HTTP_HEADER,
                configurationProperties.getPropertyAsString(ConfigurationProperty.THINGS_API_TOKEN));

        System.out.println("Proxying request with Headers:");
        System.out.println(proxyRequest.getFirstHeader(HttpHeaders.AUTHORIZATION));
    }

    @Override
    protected HttpClient createHttpClient(final HttpParams hcParams) {
        // use custom httpClient with http-proxy support
        return getHttpClient();
    }

    @Override
    protected String getConfigParam(final String key) {
        switch (key) {
            case "targetUri":
                return configurationProperties.getPropertyAsString(ConfigurationProperty.THINGS_URL) + "/api";
            case "log":
                return "true";
        }
        return super.getConfigParam(key);
    }

    private synchronized CloseableHttpClient getHttpClient() {
        if (httpClient == null) {
            try {
                final HttpClientBuilder httpClientBuilder = HttpClientBuilder.create();

                // #### ONLY FOR TEST: Trust ANY certificate (self certified, any chain, ...)
                final SSLContext sslContext =
                        new SSLContextBuilder().loadTrustMaterial(null, (chain, authType) -> true).build();
                httpClientBuilder.setSSLContext(sslContext);

                // #### ONLY FOR TEST: Do NOT verify hostname
                final SSLConnectionSocketFactory sslConnectionSocketFactory =
                        new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);

                final Registry<ConnectionSocketFactory> socketFactoryRegistry = RegistryBuilder
                        .<ConnectionSocketFactory>create().register("http",
                                PlainConnectionSocketFactory.getSocketFactory())
                        .register("https", sslConnectionSocketFactory).build();
                final PoolingHttpClientConnectionManager httpClientConnectionManager =
                        new PoolingHttpClientConnectionManager(socketFactoryRegistry);
                httpClientBuilder.setConnectionManager(httpClientConnectionManager);

                final boolean proxyEnabled =
                        configurationProperties.getPropertyAsBoolean(ConfigurationProperty.PROXY_ENABLED);
                if (proxyEnabled) {
                    final String proxyHost =
                            configurationProperties.getPropertyAsString(ConfigurationProperty.PROXY_HOST);
                    final int proxyPort = configurationProperties.getPropertyAsInt(ConfigurationProperty.PROXY_PORT);
                    final HttpHost proxy = new HttpHost(proxyHost, proxyPort);
                    httpClientBuilder.setProxy(proxy);
                }

                httpClient = httpClientBuilder.build();
            } catch (NoSuchAlgorithmException | KeyManagementException | KeyStoreException ex) {
                throw new RuntimeException(ex);
            }
        }

        return httpClient;
    }

}
