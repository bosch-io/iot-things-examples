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
      </div>
      <small>
        <p v-if="item['_revision']" class="mb-1 pl-3">_rev: {{ item['_revision'] }}</p>
        <p v-if="item['_modified']" class="mb-1 pl-3">{{ formatDate(item['_modified']) }}</p>
      </small>
    </a>
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
    },
    formatDate(item) {
      /**
       * 0 : Year
       * 1 : Month
       * 2 : Day + Time
       * --------------
       * Second split
       * 0 : Day
       * 1 : Time + ?
       */
      let yearMonth = item.split("-");
      let day = yearMonth[2].split("T");
      let time = day[1].split(".");
      return `_modified: ${day[0]}.${yearMonth[1]}.${yearMonth[0]} - ${
        time[0]
      }`;
    }
  },
  computed: {
    items: {
      get() {
        return this.$store.getters.getItems;
      }
    }
  },
  watch: {
    items: function(val) {
      if (this.isActiveId !== "") {
        this.isActiveId = "";
      }
    }
  }
};
</script>

<style>
</style>
