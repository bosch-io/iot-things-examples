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
package com.bosch.cr.examples.jwt;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Properties;

import javax.net.ssl.SSLContext;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
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
import org.apache.http.ssl.SSLContextBuilder;
import org.mitre.dsmiley.httpproxy.ProxyServlet;

/**
 * ProxyServlet to forward all requests to target service required as replacement for for cross domain requests.
 */
@WebServlet("/api/*")
public class CustomProxyServlet extends ProxyServlet {

    private static final long serialVersionUID = -8637163830288021028L;

    private static final String CONFIG_PROPERTIES = "config.properties";

    private CloseableHttpClient httpClient;
    private Properties config;

    @Override
    public void init(final ServletConfig config) throws ServletException {
        super.init(config);
    }

    @Override
    protected void service(final HttpServletRequest req, final HttpServletResponse resp) throws ServletException, IOException {
        final String auth = req.getHeader("Authorization");
        if (auth == null) {
            resp.setHeader("WWW-Authenticate", "Bearer realm=\"Proxy for Bosch IoT Things\"");
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        super.service(req, resp);
    }

    @Override
    protected void copyRequestHeaders(final HttpServletRequest req, final HttpRequest proxyRequest) {
        super.copyRequestHeaders(req, proxyRequest);
    }

    @Override
    protected String getConfigParam(final String key) {
        if ("targetUri".equals(key)) {
            return getProperty("thingsServiceEndpointUrl", "https://things.s-apps.de1.bosch-iot-cloud.com") + "/api";
        } else if ("log".equals(key)) {
            return getProperty("logProxyRequests", "true");
        }
        return super.getConfigParam(key);
    }

    @Override
    protected HttpClient createHttpClient() {
        return getHttpClient();
    }

    private synchronized String getProperty(final String key, final String defaultValue) {
        if (config == null) {
            try {
                config = new Properties(System.getProperties());
                if (new File(CONFIG_PROPERTIES).exists()) {
                    config.load(new FileReader(CONFIG_PROPERTIES));
                }
                System.out.println("Config: " + config);
            } catch (final IOException ex) {
                throw new RuntimeException(ex);
            }
        }
        return config.getProperty(key, defaultValue);
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

                final Registry<ConnectionSocketFactory> socketFactoryRegistry =
                        RegistryBuilder.<ConnectionSocketFactory>create()
                                .register("http", PlainConnectionSocketFactory.getSocketFactory())
                                .register("https", sslConnectionSocketFactory)
                                .build();
                final PoolingHttpClientConnectionManager httpClientConnectionManager =
                        new PoolingHttpClientConnectionManager(socketFactoryRegistry);
                httpClientBuilder.setConnectionManager(httpClientConnectionManager);

                final String proxyHost = getProperty("http.proxyHost", null);
                if (proxyHost != null) {
                    final int proxyPort = Integer.parseInt(getProperty("http.proxyPort", null));
                    httpClientBuilder.setProxy(new HttpHost(proxyHost, proxyPort));
                }

                httpClient = httpClientBuilder.build();
            } catch (final NoSuchAlgorithmException | KeyManagementException | KeyStoreException ex) {
                throw new RuntimeException(ex);
            }
        }

        return httpClient;
    }

}
