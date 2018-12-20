<!-- 
/*
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2018 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
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
-->

<template>
  <div>
    <nav class="navbar fixed-top navbar-light bg-primary shadow">
      <a class="navbar-brand" href="#">
        <div class="flex-container">
          <img src="../public/visual.png" width="45" height="45" alt>
          <span class="text-white">
            <span class="bold">Bosch IoT</span> Things -
            <i>Octopus bidirectional communication example</i>
          </span>
        </div>
      </a>
    </nav>
    <div class="container" style="margin-top: 95px; margin-bottom: 45px">
      <div class="row">
        <div class="col">
          <UserDataView></UserDataView>
        </div>
      </div>
      <div class="row" style="margin-top: 25px">
        <div class="col-lg-4">
          <ThingList></ThingList>
        </div>
        <div class="col-lg-8">
          <ModifyThing></ModifyThing>
        </div>
      </div>
    </div>
    <nav class="navbar fixed-bottom navbar-light bg-primary" style="margin-top: 25px"></nav>
  </div>
</template>

<script>
import UserDataView from "./components/UserData/UserDataView.vue";
import ModifyThing from "./components/ModifyThing.vue";
import ThingList from "./components/ThingList.vue";
import store from "./store";

import "es6-promise/auto";
import "./utils/bus.js";
import "./utils/api.js";

export default {
  name: "app",
  store,
  components: {
    UserDataView,
    ModifyThing,
    ThingList
  }
};
</script>

<style>
span {
  font-weight: 100;
}

.flex-container {
  display: flex;
  align-items: center;
}

.text-white {
  color: white;
}

.bold {
  font-weight: 900;
}
</style>
