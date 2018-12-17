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
