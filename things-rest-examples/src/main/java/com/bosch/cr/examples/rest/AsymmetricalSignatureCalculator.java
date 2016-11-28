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
package com.bosch.cr.examples.rest;

import java.time.OffsetDateTime;

import org.asynchttpclient.Request;
import org.asynchttpclient.RequestBuilderBase;
import org.asynchttpclient.SignatureCalculator;

/**
 * Apache Ning SignatureCalculator which calculates the asymmetrical signature for authenticating technical clients
 * at the RESTful interface of the Bosch IoT Things service.
 *
 * @since 1.0.0
 */
public class AsymmetricalSignatureCalculator implements SignatureCalculator
{
   private static final String HTTP_HEADER_AUTHORIZATION = "Authorization";
   private static final String CRS_AUTH_PREFIX = "CRS ";
   private static final String DELIMITER = ";";

   private static final String HTTP_HEADER_HOST = "Host";
   private static final String HTTP_HEADER_X_CR_DATE = "x-cr-date";
   private static final String HTTP_HEADER_X_CR_API_TOKEN = "x-cr-api-token";

   private final SignatureFactory signatureFactory;
   private final String clientId;
   private final String apiToken;

   public AsymmetricalSignatureCalculator(final SignatureFactory signatureFactory, final String clientId,
      final String apiToken)
   {
      this.signatureFactory = signatureFactory;
      this.clientId = clientId;
      this.apiToken = apiToken;
   }

   @Override
   public void calculateAndAddSignature(final Request request, final RequestBuilderBase<?> requestBuilderBase)
   {
      final String method = request.getMethod();
      final String path = request.getUri().toRelativeUrl();
      final String date = OffsetDateTime.now().toString();
      final String host = request.getUri().getHost();

      final String signatureData = String.join(DELIMITER, method, host, path, date);
      final String signature = signatureFactory.sign(signatureData);

      requestBuilderBase.addHeader(HTTP_HEADER_HOST, host);
      requestBuilderBase.addHeader(HTTP_HEADER_X_CR_DATE, date);
      requestBuilderBase.addHeader(HTTP_HEADER_X_CR_API_TOKEN, apiToken);
      requestBuilderBase.addHeader(HTTP_HEADER_AUTHORIZATION,
         CRS_AUTH_PREFIX + clientId + DELIMITER + SignatureFactory.SIGNATURE_ALGORITHM + DELIMITER + signature);
   }
}
