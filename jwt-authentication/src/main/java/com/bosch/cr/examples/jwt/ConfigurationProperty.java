/*
 * Bosch SI Example Code License Version 1.0, January 2016
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

/**
 * An enumeration of all configuration properties.
 */
public enum ConfigurationProperty
{

   /**
    * The url of the Bosch IoT Things service.
    */
   THINGS_URL("thingsServiceEndpointUrl"),

   /**
    * The API Token for the Bosch IoT Things service.
    */
   THINGS_API_TOKEN("apiToken"),

   /**
    * The proxy host to use.
    */
   PROXY_HOST("http.proxyHost"),

   /**
    * The proxy port to use.
    */
   PROXY_PORT("http.proxyPort"),

   /**
    * Whether or not the proxy should be used.
    */
   PROXY_ENABLED("http.proxyEnabled"),

   /**
    * The client id to authenticate at the Bosch IoT Permissions service.
    */
   IM_CLIENT_ID("im.clientId"),

   /**
    * The client secret to authenticate at the Bosch IoT Permissions service.
    */
   IM_CLIENT_SECRET("im.clientSecret"),

   /**
    * The url of the Bosch IoT Permissions service.
    */
   IM_URL("im.serviceUrl"),

   /**
    * The default tenant of the Bosch IoT Permissions service.
    */
   IM_DEFAULT_TENANT("im.defaultTenant"),

   /**
    * The client id to authenticate at google oauth api.
    */
   GOOGLE_CLIENT_ID("google.clientId"),

   /**
    * The client secret to authenticate at google oauth api.
    */
   GOOGLE_CLIENT_SECRET("google.clientSecret"),

   /**
    * The url for google to redirect after successful authentication.
    */
   GOOGLE_CLIENT_REDIRECT_URL("google.redirectUrl"),

   /**
    * Defines if the secure flag of the cookie is set or not.
    */
   SECURE_COOKIE("secureCookie");

   private final String name;

   ConfigurationProperty(final String name)
   {
      this.name = name;
   }

   public String getName()
   {
      return name;
   }

   @Override
   public String toString()
   {
      return name;
   }

}
