import Vue from "vue";
import { NativeEventSource, EventSourcePolyfill } from "event-source-polyfill";
import store from "../store";

const EventSource = NativeEventSource || EventSourcePolyfill;

export default (window.Event = new class {
  constructor() {
    this.vue = new Vue({
      name: "eventbus",
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
        },
        items: {
          get() {
            return this.$store.getters.getItems;
          }
        }
      }
    });
    this.source = [];
  }

  fire(event, data = null) {
    if (event === "initSSE") {
      // start listening with a little timeout
      this.vue.items.forEach(element => {
        this.source.push(
          new EventSourcePolyfill(
            `${this.vue.connection.http_endpoint}/api/2/things?=${
              element.thingId
            }`,
            {
              headers: {
                Authorization: Api.getConfig().headers.Authorization,
                "x-cr-api-token": this.vue.connection.api_token
              },
              withCredentials: true
            }
          )
        );
      });
      this.source.forEach(element => {
        element.onmessage = res => {
          console.log(res);
          this.vue.$store.commit("incrementTelemetryCount");
          this.vue.$store.dispatch("telemetryUpdate");
        };
      });
    } else if (event === "connectionError") {
      this.source.forEach(element => {
        element.close();
      });
    } else {
      this.vue.$emit(event, data);
    }
  }

  listen(event, callback) {
    this.vue.$on(event, callback);
  }
}());
