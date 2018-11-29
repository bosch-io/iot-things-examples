import Vue from "vue";
import store from "../store";
import axios from "axios";

export default (window.Api = new class {
  constructor() {
    this.vue = new Vue({
      name: "api",
      store,
      computed: {
        connection: {
          get() {
            return this.$store.getters.getConnection;
          }
        },
        selected: {
          get() {
            return this.$store.getters.getSelected;
          }
        }
      }
    });

    this.base = this.vue.connection.http_endpoint;
    this.apiVersion = this.base + "/api/2";

    this.routes = {
      policies: this.apiVersion + "/policies",
      searchThings: this.apiVersion + "/search/things",
      things: this.apiVersion + "/things",
      messages: this.apiVersion + "/things/" + this.vue.selected.thingId
    };
  }

  createAuthHeader = (username, password) => {
    return (
      "Basic " +
      btoa(
        encodeURIComponent(username + ":" + password).replace(
          /%([0-9A-F]{2})/g,
          function toSolidBytes(match, p1) {
            return String.fromCharCode("0x" + p1);
          }
        )
      )
    );
  };

  getConfig = () => {
    return {
      headers: {
        Authorization: this.createAuthHeader(
          this.vue.connection.username,
          this.vue.connection.password
        ),
        "x-cr-api-token": this.vue.connection.api_token
      }
    };
  };

  getAllThings = () => {
    return axios.get(this.routes.searchThings, this.getConfig());
  };

  saveChanges = thing => {
    return axios.put(
      this.routes.things + "/" + thing.thingId,
      thing,
      this.getConfig()
    );
  };

  sendMessage = (message, topic) => {
    console.log(
      `${this.routes.things}/${
        this.vue.selected.thingId
      }/inbox/messages/${topic}`
    );
    return axios.post(
      `${this.routes.things}/${
        this.vue.selected.thingId
      }/inbox/messages/${topic}`,
      `"${message}"`,
      this.getConfig()
    );
  };
}());
