/* eslint-disable */

<template>
  <div class="list-group shadow">
    <a
      v-bind:key="item.thingId"
      v-for="item in items"
      @click="select(item, $event)"
      href="#/"
      :class="item.thingId === isActiveId ? cssIsActive : cssIsNotActive"
    >
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">{{ item.thingId }}</h5>
        <!-- <small>{{ item.policyId }}</small> -->
      </div>
      <!-- <p class="mb-1">{{ item.attributes.type || 'no type' }}</p> -->
    </a>
    <div class="list-group-item disabled-list-item">
      <div>
        <span class="lead">
          <font-awesome-icon style="margin-right: 5px;" icon="plus"/>
          <i>Create new thing</i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ThingList",
  data() {
    return {
      cssIsActive:
        "list-group-item list-group-item-action flex-column align-items-start active",
      cssIsNotActive:
        "list-group-item list-group-item-action flex-column align-items-start",
      isActiveId: ""
    };
  },
  methods: {
    select(thing) {
      if (thing === "newThing") thing = this.createNewThingTemplate();
      this.$store.dispatch("handleSelected", thing).then(res => {
        if (res.status == 200) {
          this.isActiveId = thing.thingId;
        }
      });
    }
    // Unused for now:
    // createNewThingTemplate() {
    //   let namespace = this.userdata.filter(object => {
    //     return object.key == "namespace";
    //   })[0].value;
    //   let template = `{"thingId": "${namespace}:<newThing>", "policyId": "${namespace}:<policy>", "attributes": {"type": null}, "features": {"featureA": {"properties": {"propertyA": "Hello World"}}}}`;
    //   return JSON.parse(template);
    // }
  },
  computed: {
    items: {
      get() {
        return this.$store.getters.getItems;
      }
    },
    userdata: {
      get() {
        return this.$store.getters.getUserData;
      }
    }
  }
};
</script>

<style>
.disabled-list-item {
  cursor: not-allowed;
  color: grey;
}
</style>