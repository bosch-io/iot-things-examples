/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2016 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
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
package com.bosch.cr.integration.helloworld;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Properties;

import javax.net.ssl.SSLContext;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.AuthenticationException;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicHttpRequest;
import org.apache.http.ssl.SSLContextBuilder;

/**
 * ProxyServlet to forward all requests to target service required as replacement for for cross domain requests.
 */
@WebServlet(ProxyServlet.URL_PATTERN)
public class ProxyServlet extends HttpServlet
{

   private static final String URL_PREFIX = "/cr";
   static final String URL_PATTERN = URL_PREFIX + "/*";

   private HttpHost targetHost;
   private CloseableHttpClient httpClient;
   private Properties props;

   @Override
   public void init(ServletConfig config) throws ServletException
   {
      super.init(config);
      props = new Properties(System.getProperties());
      if (new File("config.properties").exists())
      {
         try (FileReader reader = new FileReader("config.properties"))
         {
            props.load(reader);
         }
         catch (IOException e)
         {
            throw new RuntimeException(e);
         }
      }
      else
      {
         try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("config.properties"))
         {
            props.load(is);
         }
         catch (IOException e)
         {
            throw new RuntimeException(e);
         }
      }
      System.out.println("Config: " + props);
      targetHost = HttpHost.create(props.getProperty("thingsServiceEndpointUrl", "https://things.apps.bosch-iot-cloud.com"));
   }

   @Override
   protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException
   {
      String auth = req.getHeader("Authorization");
      if (auth == null)
      {
         resp.setHeader("WWW-Authenticate", "BASIC realm=\"Proxy for Bosch IoT Things\"");
         resp.sendError(HttpServletResponse.SC_UNAUTHORIZED);
         return;
      }

      try
      {
         long time = System.currentTimeMillis();
         CloseableHttpClient c = getHttpClient();

         String targetUrl = URL_PREFIX + req.getPathInfo() + (req.getQueryString() != null ? ("?" + req.getQueryString()) : "");
         BasicHttpRequest targetReq = new BasicHttpRequest(req.getMethod(), targetUrl);

         String user = "";
         if (auth.toUpperCase().startsWith("BASIC "))
         {
            String userpassDecoded = new String(new sun.misc.BASE64Decoder().decodeBuffer(auth.substring("BASIC ".length())));
            user = userpassDecoded.substring(0, userpassDecoded.indexOf(':'));
            String pass = userpassDecoded.substring(userpassDecoded.indexOf(':') + 1);
            UsernamePasswordCredentials creds = new UsernamePasswordCredentials(user, pass);
            targetReq.addHeader(new BasicScheme().authenticate(creds, targetReq, null));
         }

         targetReq.addHeader("x-cr-api-token", req.getHeader("x-cr-api-token"));
         CloseableHttpResponse targetResp = c.execute(targetHost, targetReq);

         System.out.println("Request: " + targetHost + targetUrl + ", user " + user + " -> " + (System.currentTimeMillis() - time) + " msec: "
            + targetResp.getStatusLine());

         resp.setStatus(targetResp.getStatusLine().getStatusCode());
         targetResp.getEntity().writeTo(resp.getOutputStream());
      }
      catch (IOException | AuthenticationException ex)
      {
         throw new RuntimeException(ex);
      }
   }

   /**
    * Create http client
    */
   private synchronized CloseableHttpClient getHttpClient()
   {
      if (httpClient == null)
      {
         HttpClientBuilder httpClientBuilder = HttpClientBuilder.create();

         if (props.getProperty("http.proxyHost") != null)
         {
            httpClientBuilder.setProxy(new HttpHost(props.getProperty("http.proxyHost"), Integer.parseInt(props.getProperty("http.proxyPort"))));
         }

         if (props.getProperty("http.proxyUser") != null)
         {
            CredentialsProvider credsProvider = new BasicCredentialsProvider();
            credsProvider.setCredentials(new AuthScope(targetHost),
               new UsernamePasswordCredentials(props.getProperty("http.proxyUser"), props.getProperty("http.proxyPwd")));
            httpClientBuilder.setDefaultCredentialsProvider(credsProvider);
         }

         httpClient = httpClientBuilder.build();
      }

      return httpClient;
   }
}
