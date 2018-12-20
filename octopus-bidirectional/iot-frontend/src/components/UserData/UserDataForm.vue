<template>
  <div>
    <div class="form-group">
      <div
        class="m-top-10px"
        v-for="key in Object.keys(connection)"
        :key="key"
        v-show="key !== 'http_endpoint' && key !== 'solution_id'"
      >
        <label :for="key">
          <small class="grey">
            <i>{{ key }}:</i>
          </small>
        </label>
        <input
          :type="key === 'password' ? 'password' : 'text'"
          class="form-control"
          :id="key"
          :value="connection[key]"
          @input="setUserData($event)"
        >
      </div>
      <button
        v-show="!connectionStatus"
        class="btn btn-primary m-top-16px"
        @click="connect()"
        :disabled="connectionEmpty"
      >Connect</button>
      <button
        v-show="connectionStatus"
        class="btn btn-sencondary m-top-16px"
        @click="disconnect()"
      >Disconnect</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "user-data-form",

  data() {
    return {
      connectionEmpty: true
    };
  },

  computed: {
    connection: {
      get() {
        return this.$store.getters.getConnection;
      }
    },
    connectionStatus: {
      get() {
        return this.$store.getters.getConnectionStatus;
      }
    }
  },

  watch: {
    connection: function(val) {
      let isOneEmpty = Object.keys(this.connection).map(
        key => this.connection[key] === ""
      );
      this.connectionEmpty = isOneEmpty.includes(true);
    }
  },

  methods: {
    setUserData(event) {
      this.connection[event.target.id] = event.target.value;
      this.$store.commit("setConnectionData", this.connection);
    },
    connect() {
      this.$store.dispatch("getAllThings");
    },
    disconnect() {
      this.$store.dispatch("disconnect");
    }
  }
};
</script>

<style>
.m-top-10px {
  margin-top: 10px;
}

.m-top-16px {
  margin-top: 26px;
}

.grey {
  color: grey;
}
</style>