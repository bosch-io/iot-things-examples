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

/* Copyright (c) 2018 Bosch Software Innovations GmbH, Germany. All rights reserved. */

import { Frontend } from './service/frontend'
import { DeviceCommissioning } from './service/device-commissioning'
import { DeviceSimulation } from './service/device-simulation'
import { Accessories } from './service/accessories'

async function start(args: string[]) {

  const startAll = Object.keys(args).length === 0

  let services: Promise<any>[] = []

  if (startAll || args.indexOf('accessories') >= 0) {
    if (!startAll) args.splice(args.indexOf('accessories'), 1)
    services.push(new Accessories().start())
  }
  if (startAll || args.indexOf('commissioning') >= 0) {
    if (!startAll) args.splice(args.indexOf('commissioning'), 1)
    services.push(new DeviceCommissioning().start())
  }
  if (startAll || args.indexOf('simulation') >= 0) {
    if (!startAll) args.splice(args.indexOf('simulation'), 1)
    services.push(new DeviceSimulation().start())
  }

  // wait for parallel start of supporting services
  await Promise.all(services)
  services = []

  if (startAll || args.indexOf('frontend') >= 0) {
    if (!startAll) args.splice(args.indexOf('frontend'), 1)
    services.push(new Frontend().start())
  }

  if (args.length > 0) {
    console.log(`Unknown options: ${args}. Supported options: [accessories|commissioning|simulation|frontend]*`)
    process.exit(1)
  }

  // wait for all starts
  await Promise.all(services)
}

start(process.argv.slice(2)).catch(e => console.log(`Start failed: ${e}`))
