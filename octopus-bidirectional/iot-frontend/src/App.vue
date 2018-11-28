<template>
    <div>
        <nav class="navbar fixed-top navbar-light bg-primary shadow">
            <a class="navbar-brand" href="#">
              <div class="flex-container">
                <img src="../public/visual.png" width="35" height="35" alt="">
                <span class="text-white">
                  <i>
                    Bosch IoT Things - Command & Control Example
                  </i>
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
                <div class="col-lg-6">
                    <ModifyThing></ModifyThing>
                </div>
                <div class="col-lg-6">
                    <ThingList></ThingList>
                </div>
            </div>
        </div>
            <nav class="navbar fixed-bottom navbar-light bg-primary" style="margin-top: 25px">
        </nav>
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
</style>
