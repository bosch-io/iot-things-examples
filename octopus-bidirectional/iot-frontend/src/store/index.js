/* eslint-disable */

import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    connection: {
      http_endpoint: "https://things-int.s-apps.de1.bosch-iot-cloud.com",
      api_token: "121121dd63b04089ad19a454bcbc4d66",
      solution_id: "8de86d77-526c-46e5-8856-4fc39b8eb067",
      username: "87BF11FF7172AF7C6A086B5\\john.doe",
      password: "john.doePw2!"
    },
    items: [],
    selected: "No thing selected",
    connectionStatus: false,
    telemetryCount: 0
  },

  getters: {
    getConnection: state => {
      return state.connection;
    },
    getSelected: state => {
      return state.selected;
    },
    getItems: state => {
      return state.items;
    },
    getConnectionStatus: state => {
      return state.connectionStatus;
    },
    getTelemetryCount: state => {
      return state.telemetryCount;
    }
  },

  mutations: {
    setSelected(state, thing) {
      state.selected = thing;
    },
    setItems(state, items) {
      state.items = items;
    },
    setConnectionData(state, value) {
      state.connection = Object.assign({}, state.connection, value);
    },
    setConnectionStatus(state, status) {
      state.connectionStatus = status;
    },
    incrementTelemetryCount(state) {
      state.telemetryCount += 1;
    },
    setDisconnected(state) {
      state.connectionStatus = false;
      state.selected = "No thing selected.";
      state.items = [];
    }
  },

  actions: {
    /*
     * API action calls
     */
    getAllThings({ commit }) {
      return new Promise((resolve, reject) => {
        Api.getAllThings()
          .then(res => {
            this.commit("setItems", res.data.items);
            this.commit("setConnectionStatus", true);
            resolve(res);
          })
          .catch(err => resolve(err));
      });
    },
    saveChanges({ state }, thing) {
      return new Promise((resolve, reject) => {
        Api.saveChanges(thing)
          .then(res => resolve(res))
          .catch(err => reject(err));
      });
    },
    sendMessage({ state }, message) {
      return new Promise((resolve, reject) => {
        Api.sendMessage(message)
          .then(res => resolve(res))
          .catch(err => reject(err));
      });
    },

    /*
     * Internal state mutation actions
     */
    handleSelected({ commit }, thing) {
      return new Promise((resolve, reject) => {
        if (thing.thingId === undefined) reject({ err: "ThingId undefined!" });
        this.commit("setSelected", thing);
        resolve({ status: 200 });
      });
    },
    disconnect({ commit }) {
      this.commit("setDisconnected");
    },
    telemetryUpdate() {
      this.dispatch("getAllThings");
    }
  }
});

export default store;
