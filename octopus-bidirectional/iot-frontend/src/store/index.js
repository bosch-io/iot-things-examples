/* eslint-disable */

import Vue from "vue";
import Vuex from "vuex";
import deepmerge from "deepmerge";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    connection: {
      http_endpoint: "https://things.s-apps.de1.bosch-iot-cloud.com",
      api_token: "d629ca56884344d0ac63d5a91ba4e8c7",
      username: "5KMCHSS616\\octopus",
      password: "Octopus1!"
    },
    items: {},
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
    setItem(state, item) {
      let thing = JSON.parse(item);
      state.items[thing.thingId] = deepmerge(state.items[thing.thingId], thing);
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
      state.items = {};
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
            this.commit(
              "setItems",
              res.data.items.reduce(function(map, item) {
                map[item.thingId] = item;
                return map;
              }, {})
            );
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
    sendMessage({ state }, payload) {
      return new Promise((resolve, reject) => {
        Api.sendMessage(payload.message, payload.topic, payload.corrId)
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
    telemetryUpdate({ commit }, thing) {
      this.commit("setItem", thing);
    }
  }
});

export default store;
