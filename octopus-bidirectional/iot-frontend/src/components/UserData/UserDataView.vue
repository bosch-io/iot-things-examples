<template>
  <div class="card shadow">
    <div class="card-header lead">
      <div class="row">
        <div class="col-md-6">
          CONNECTION
          <span v-show="connectionStatus === true" class="badge badge-success">established</span>
        </div>
        <div class="col-md-6 text-right">
          <button class="btn btn-outline-secondary" @click="showData">Collapse</button>
        </div>
      </div>
    </div>
    <div class="card-body" v-show="!connectionStatus || collapsed">
      <div class="row">
        <div class="col-sm-6">
          <user-data-form></user-data-form>
        </div>
        <div class="col-sm-6">
          <div class="jumbotron" style="height: 100%">
            <p class="lead">Connection info</p>
            <hr class="my-4">
            <p>
              Connection to Server -
              <span
                v-show="connectionStatus === true"
                class="badge badge-success"
              >established</span>
              <span v-show="connectionStatus === false" class="badge badge-danger">error</span>
            </p>
            <p>
              Server sent events -
              <span class="badge badge-info">{{ telemetryCount }}</span>
            </p>
            <button
              @click="initSSE"
              type="button"
              class="btn btn-secondary"
              v-show="connectionStatus && !gettingTelemetry"
            >Receive push updates</button>
            <button
              @click="stopSSE"
              type="button"
              class="btn btn-outline-secondary"
              v-show="gettingTelemetry"
            >Stop push updates</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserDataForm from "./UserDataForm.vue";

export default {
  name: "UserDataView",

  components: {
    UserDataForm
  },

  data() {
    return {
      gettingTelemetry: false,
      collapsed: false
    };
  },
  computed: {
    connectionStatus: {
      get() {
        return this.$store.getters.getConnectionStatus;
      }
    },
    telemetryCount: {
      get() {
        return this.$store.getters.getTelemetryCount;
      }
    }
  },
  watch: {
    connectionStatus: function(val) {
      if (val === true) {
        // Connect to server sent events
        this.initSSE();
      } else {
        this.stopSSE();
      }
    }
  },
  methods: {
    initSSE() {
      this.gettingTelemetry = true;
      Event.fire("initSSE");
    },
    stopSSE() {
      this.gettingTelemetry = false;
      Event.fire("connectionError");
    },
    showData() {
      this.collapsed = !this.collapsed;
    }
  }
};
</script>

<style>
</style>
