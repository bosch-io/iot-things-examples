<template>
    <div class="card shadow">
        <div class="card-header lead">
            USER-CONFIGURATION
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-sm-6">
                    <user-data-form></user-data-form>
                </div>
                <div class="col-sm-6">
                    <div class="jumbotron" style="height: 100%">
                        <p class="lead">Connection informations ..</p>
                        <hr class="my-4">
                        <p>Connected to Server -
                            <span v-show="connectionStatus === true" class="badge badge-success">Established</span>
                            <span v-show="connectionStatus === false" class="badge badge-danger">Error</span>
                        </p>
                        <p>Server sent events -
                            <span class="badge badge-info">{{ telemetryCount }}</span>
                        </p>
                        <button @click="initSSE" type="button" class="btn btn-secondary" v-show="connectionStatus && !gettingTelemetry">Init SSE</button>
                        <button @click="stopSSE" type="button" class="btn btn-outline-secondary" v-show="gettingTelemetry">Stop SSE</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserDataForm from './UserDataForm.vue'

export default {
  name: "UserDataView",

  components: {
    UserDataForm
  },

  data() {
    return {
      gettingTelemetry: false
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
  methods: {
    initSSE() {
      this.gettingTelemetry = true;
      Event.fire("initSSE");
    },
    stopSSE() {
      this.gettingTelemetry = false;
      Event.fire("connectionError");
    }
  }
};
</script>

<style>
</style>