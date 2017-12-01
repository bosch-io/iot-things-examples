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

import static java.util.Objects.requireNonNull;

import javax.servlet.http.Cookie;

/**
 * Helper class for creating a {@link Cookie}.
 */
public final class CookieUtil {

    /**
     * The name of the JWT authentication cookie.
     */
    private static final String JWT_AUTHENTICATION_TOKEN_COOKIE_NAME = "jwt-authentication-token";

    private CookieUtil() {
        // no-op
    }

    /**
     * Returns a {@code Cookie} for the given {@code name}, {@code value}, {@code secure} and {@code maxAge}.
     *
     * @param value the value of the cookie.
     * @param secure whether or not the cookie is secure.
     * @param maxAge the expiry of the cookie.
     * @return the cookie.
     * @throws NullPointerException if any argument is {@code null}.
     */
    public static Cookie getJwtAuthenticationCookie(final String value, final boolean secure, final int maxAge) {
        requireNonNull(value);
        requireNonNull(secure);
        requireNonNull(maxAge);

        final Cookie cookie = new Cookie(JWT_AUTHENTICATION_TOKEN_COOKIE_NAME, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setMaxAge(maxAge);
        return cookie;
    }

    /**
     * Returns whether or not the given {@code cookie} is an JWT authentication cookie.
     *
     * @param cookie the cookie.
     * @return {@code true} if the cookie is an JWT authentication cookie, else {@code false}.
     */
    public static boolean isJwtAuthenticationCookie(final Cookie cookie) {
        return cookie.getName().equals(JWT_AUTHENTICATION_TOKEN_COOKIE_NAME);
    }

}
