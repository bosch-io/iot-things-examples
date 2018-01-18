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
package com.bosch.iot.things.example.historian;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.net.URI;
import java.net.URISyntaxException;
import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.WriteResultChecking;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * Web/REST Controll of Example Historian.
 * <p>
 * Provides two endpoints: /history/data for the raw json history data and /history/view as a web chart view of the
 * history.
 */
@RestController
public class Controller {

    public static class HistoricData {

        private final Param param;
        private final Map data;

        public HistoricData(Param param, Map data) {
            this.param = param;
            this.data = data;
        }

        public Param getParam() {
            return this.param;
        }

        public Map getData() {
            return this.data;
        }
    }

    public static final class Param {

        private final String thingId;
        private final String featureId;
        private final String propertyPath;

        private Param(String thingId, String featureId, String propertyPath) {
            this.thingId = thingId;
            this.featureId = featureId;
            this.propertyPath = propertyPath;
        }

        public String getThingId() {
            return thingId;
        }

        public String getFeatureId() {
            return featureId;
        }

        public String getPropertyPath() {
            return propertyPath;
        }

        static List<Param> createFromRequest() {
            HttpServletRequest request =
                    ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);

            List<String> paths = expandBracketRepeats(fullPath);

            List<Param> result = new ArrayList<>();
            for (String p : paths) {
                Matcher matcher = PARAM_PATTERN.matcher(p);
                if (!matcher.matches()) {
                    throw new IllegalArgumentException(fullPath);
                }
                result.add(new Param(matcher.group(1), matcher.group(2), matcher.group(3)));
            }
            return result;
        }

        @Override
        public String toString() {
            return "{" + "thingId: " + thingId + ", featureId: " + featureId + ", propertyPath: " + propertyPath + "}";
        }
    }

    private static final Logger LOGGER = LoggerFactory.getLogger(Controller.class);

    // URL Pattern: * / history / [data|view|embeddedview] / <thingId> / features / <featureId> / properties / <propertyPath>
    // with support for the following repeat-syntax: a [ b, c ] z --> a b z + a c z
    private static final Pattern PARAM_PATTERN = Pattern.compile(".*/history/.+?/(.+?)/features/(.+?)/properties/(.+)");

    // Property Pattern: features/
    private Properties theConfig;
    private CloseableHttpClient theHttpClient;

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void postConstruct() {
        mongoTemplate.setWriteResultChecking(WriteResultChecking.EXCEPTION);
    }

    @RequestMapping("/history/data/**")
    public List<HistoricData> getHistoricData() throws Exception {
        List<Param> params = Param.createFromRequest();

        List<HistoricData> data = new ArrayList<>();
        for (Param p : params) {

            if (!checkAccess(p.thingId, p.featureId, p.propertyPath)) {
                LOGGER.info("Property not found or access denied: {}", params);
                return null;
            }

            String id = p.thingId + "/features/" + p.featureId + "/properties/" + p.propertyPath;
            LOGGER.debug("Query MongoDB on id: {}", id);

            Map m = mongoTemplate.findById(id, Map.class, "history");
            if (m == null) {
                return null;
            }
            m.remove("_id");

            data.add(new HistoricData(p, m));
        }

        return data;
    }

    @RequestMapping("/history/view/**")
    public ModelAndView getViewHistory() throws Exception {
        return getViewHistory(false);
    }

    @RequestMapping("/history/embeddedview/**")
    public ModelAndView getEmbeddedViewHistory() throws Exception {
        return getViewHistory(true);
    }

    public ModelAndView getViewHistory(boolean embedded) throws Exception {
        List<HistoricData> m = getHistoricData();
        List<Param> p = Param.createFromRequest();

        ModelAndView mav = new ModelAndView();
        mav.addObject("params", p);
        mav.addObject("values", m);

        mav.addObject("clientId", getConfig().getProperty("clientId"));
        if (embedded) {
            mav.addObject("embedded", Boolean.TRUE);
        }
        mav.setViewName("historyview");
        return mav;
    }

    /**
     * Check access on specific property by doing a callback to the Things service.
     */
    private boolean checkAccess(String thingId, String featureId, String propertyPath)
            throws UnsupportedEncodingException, IOException {
        HttpServletRequest httpReq =
                ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        HttpServletResponse httpRes =
                ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getResponse();

        // enforce BASIC auth
        String auth = httpReq.getHeader("Authorization");
        if (auth == null) {
            httpRes.setHeader("WWW-Authenticate", "BASIC realm=\"Proxy for Bosch IoT Things\"");
            httpRes.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        String httpid = URLEncoder.encode(thingId, "UTF-8") + "/features/" + URLEncoder.encode(featureId, "UTF-8") +
                "/properties/" + encodeURIComponent(propertyPath);
        HttpGet thingsRequest = new HttpGet(getConfig().getProperty("thingsServiceEndpointUrl")
                + "/api/2/things/" + httpid);

        // fill in apiToken if not provided
        String apiToken = getConfig().getProperty("apiToken");
        if (apiToken != null && httpReq.getHeader("x-cr-api-token") == null) {
            thingsRequest.addHeader("x-cr-api-token", apiToken);
        }

        // forward all other Headers to Things service
        Enumeration<String> headerNames = httpReq.getHeaderNames();
        if (headerNames != null) {
            final Set<String> headersToIgnore = new HashSet(Arrays.asList(new String[]{"host"}));
            while (headerNames.hasMoreElements()) {
                String name = headerNames.nextElement();
                if (!headersToIgnore.contains(name)) {
                    thingsRequest.addHeader(name, httpReq.getHeader(name));
                }
            }
        }

        String username = null;
        if (auth.toUpperCase().startsWith("BASIC ")) {
            String userpassDecoded = new String(Base64.getDecoder().decode(auth.substring("BASIC ".length())));
            username = userpassDecoded.substring(0, userpassDecoded.indexOf(':'));
        }
        LOGGER.debug("Callback to Things service: {} - with user {}", thingsRequest, username);

        try (CloseableHttpResponse response = getHttpClient().execute(thingsRequest)) {
            LOGGER.debug("... retured {}", response.getStatusLine());

            int statusCode = response.getStatusLine().getStatusCode();
            if (statusCode < 200 || statusCode > 299) {
                httpRes.setStatus(statusCode);
                return false;
            }
        }

        return true;
    }

    private synchronized Properties getConfig() {
        if (theConfig == null) {
            theConfig = new Properties(System.getProperties());
            try {
                if (new File("config.properties").exists()) {
                    theConfig.load(new FileReader("config.properties"));
                } else {
                    InputStream i =
                            Thread.currentThread().getContextClassLoader().getResourceAsStream("config.properties");
                    theConfig.load(i);
                    i.close();
                }
                LOGGER.info("Used config: {}", theConfig);
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
        return theConfig;
    }

    private synchronized CloseableHttpClient getHttpClient() {
        if (theHttpClient == null) {

            HttpClientBuilder httpClientBuilder = HttpClientBuilder.create();

            // #### ONLY FOR TEST: Trust ANY certificate (self certified, any chain, ...)
            //try {
            //   SSLContext sslContext = new SSLContextBuilder().loadTrustMaterial(null, (chain, authType) -> true).build();
            //   httpClientBuilder.setSSLContext(sslContext);
            //
            //   // #### ONLY FOR TEST: Do NOT verify hostname
            //   SSLConnectionSocketFactory sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);
            //
            //   Registry<ConnectionSocketFactory> socketFactoryRegistry = RegistryBuilder.<ConnectionSocketFactory>create()
            //           .register("http", PlainConnectionSocketFactory.getSocketFactory())
            //           .register("https", sslConnectionSocketFactory)
            //           .build();
            //   PoolingHttpClientConnectionManager httpClientConnectionManager = new PoolingHttpClientConnectionManager(socketFactoryRegistry);
            //   httpClientBuilder.setConnectionManager(httpClientConnectionManager);
            //} catch (NoSuchAlgorithmException | KeyManagementException | KeyStoreException ex) {
            //   LOGGER.error(ex.getMessage(), ex);
            //}

            Properties config = getConfig();
            if (config.getProperty("http.proxyHost") != null) {
                httpClientBuilder.setProxy(new HttpHost(config.getProperty("http.proxyHost"),
                        Integer.parseInt(config.getProperty("http.proxyPort"))));
            }
            if (config.getProperty("http.proxyUser") != null) {
                CredentialsProvider credsProvider = new BasicCredentialsProvider();
                credsProvider.setCredentials(
                        new AuthScope(HttpHost.create(getConfig().getProperty("thingsServiceEndpointUrl"))),
                        new UsernamePasswordCredentials(config.getProperty("http.proxyUser"),
                                config.getProperty("http.proxyPwd")));
                httpClientBuilder.setDefaultCredentialsProvider(credsProvider);
            }

            theHttpClient = httpClientBuilder.build();
        }
        return theHttpClient;
    }

    /**
     * Expand comma seperated alternatives put in square brackets in a String.
     */
    private static List<String> expandBracketRepeats(String s) {
        List<String> result = new ArrayList<>();

        int p = s.indexOf("[");
        if (p >= 0) {
            // find matching closing bracket
            int q = p;
            int level = 0;
            while (q < s.length() && level >= 0) {
                q++;
                if (s.charAt(q) == '[') {
                    level++;
                } else if (s.charAt(q) == ']') {
                    level--;
                }
            }
            if (level >= 0) {
                throw new IllegalArgumentException("Matching bracket not found: " + s);
            }

            String prefix = s.substring(0, p);
            String repeats = s.substring(p + 1, q);
            String suffix = s.substring(q + 1);

            // first do recursive expand within current bracket pair
            List<String> expands = expandBracketRepeats(repeats);

            // then expand current bracket pair
            for (String e : expands) {
                String[] parts = e.split(",");
                for (String part : parts) {
                    // expand recursivly to also do expand in suffixes
                    result.addAll(expandBracketRepeats(prefix + part + suffix));
                }
            }
        } else {
            result.add(s);
        }

        return result;
    }

    /** Replacement for URLEncoder.encode(s, "UTF-8") with same sementics as JavaScript encodeURIComponent. */
    private static String encodeURIComponent(String s) {
        try {
			return new URI(null, null, s, null).getRawPath();
		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		}
    }    


}
