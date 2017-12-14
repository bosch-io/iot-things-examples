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

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Provides access to {@link Properties} defined in the {@code config.properties} file.
 */
public final class ConfigurationProperties {

    private static final String CONFIG_PROPERTIES_FILE_NAME = "config.properties";

    private static final ConfigurationProperties INSTANCE = new ConfigurationProperties();

    private final Properties config;

    private ConfigurationProperties() {
        config = getConfig();
    }

    /**
     * Returns the {@code ConfigurationProperties} instance.
     *
     * @return the ConfigurationProperties.
     */
    public static ConfigurationProperties getInstance() {
        return INSTANCE;
    }

    /**
     * Returns the value of the given {@code property} as a {@code String}.
     *
     * @param property the property.
     * @return the value.
     */
    public String getPropertyAsString(final ConfigurationProperty property) {
        return config.getProperty(property.getName());
    }

    /**
     * Returns the value of the given {@code property} as an {@code int}.
     *
     * @param property the property.
     * @return the value.
     */
    public int getPropertyAsInt(final ConfigurationProperty property) {
        return Integer.parseInt(config.getProperty(property.getName()));
    }

    /**
     * Returns the value of the given {@code property} as a {@code boolean}.
     *
     * @param property the property.
     * @return the value.
     */
    public boolean getPropertyAsBoolean(final ConfigurationProperty property) {
        return Boolean.parseBoolean(config.getProperty(property.getName()));
    }

    private synchronized Properties getConfig() {
        final Properties config;

        try {
            config = new Properties(System.getProperties());
            if (new File(CONFIG_PROPERTIES_FILE_NAME).exists()) {
                config.load(new FileReader(CONFIG_PROPERTIES_FILE_NAME));
            } else {
                final InputStream i =
                        Thread.currentThread().getContextClassLoader().getResourceAsStream(CONFIG_PROPERTIES_FILE_NAME);
                config.load(i);
                i.close();
            }
        } catch (final IOException ex) {
            throw new RuntimeException(ex);
        }

        return config;
    }

}
