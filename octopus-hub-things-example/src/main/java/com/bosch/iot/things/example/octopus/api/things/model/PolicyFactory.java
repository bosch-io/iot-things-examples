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
package com.bosch.iot.things.example.octopus.api.things.model;

import static com.bosch.iot.things.example.octopus.api.things.ConfigurationProperties.getPropertyOrThrowException;

import java.util.Arrays;
import java.util.Collections;

import org.eclipse.ditto.model.policies.EffectedPermissions;
import org.eclipse.ditto.model.policies.Policy;
import org.eclipse.ditto.model.policies.PolicyEntry;
import org.eclipse.ditto.model.policies.Resource;
import org.eclipse.ditto.model.policies.ResourceKey;
import org.eclipse.ditto.model.policies.Resources;
import org.eclipse.ditto.model.policies.Subject;
import org.eclipse.ditto.model.policies.SubjectType;
import org.eclipse.ditto.model.policies.Subjects;

import com.bosch.iot.things.example.octopus.api.things.SolutionInformation;

public class PolicyFactory {

    private static final String WRITE_PERMISSION = "WRITE";
    private static final String READ_PERMISSION = "READ";
    public static final String POLICY_ID = getPropertyOrThrowException("solution.namespace") + ":octopus";

    public static Policy newInstance() {
        return Policy.newBuilder(POLICY_ID)
                .set(buildOwnerEntry())
                .set(buildHubEntry())
                .build();
    }

    private static PolicyEntry buildOwnerEntry() {

        final Resources resources = Resources.newInstance(
                Resource.newInstance(ResourceKey.newInstance("thing:/"), buildOwnerEffectedPermissions()),
                Resource.newInstance(ResourceKey.newInstance("message:/"), buildOwnerEffectedPermissions()),
                Resource.newInstance(ResourceKey.newInstance("policy:/"), buildOwnerEffectedPermissions()));

        return PolicyEntry.newInstance("owner", Subjects.newInstance(Collections.emptyList()), resources);
    }

    private static EffectedPermissions buildOwnerEffectedPermissions() {
        return EffectedPermissions.newInstance(Arrays.asList(READ_PERMISSION, WRITE_PERMISSION),
                Collections.emptyList());
    }

    private static PolicyEntry buildHubEntry() {
        final Subjects subjects = Subjects.newInstance(
                Subject.newInstance(
                        "integration:" + SolutionInformation.SOLUTION_ID + ":hub",
                        SubjectType.newInstance("iot-things-clientid")));

        final Resources resources = Resources.newInstance(
                Resource.newInstance(ResourceKey.newInstance("thing:/features"), buildHubEffectedPermissions()),
                Resource.newInstance(ResourceKey.newInstance("message:/"), buildHubEffectedPermissions()));

        return PolicyEntry.newInstance("hub", subjects, resources);
    }

    private static EffectedPermissions buildHubEffectedPermissions() {
        return EffectedPermissions.newInstance(Collections.singletonList(WRITE_PERMISSION), Collections.emptyList());
    }
}
