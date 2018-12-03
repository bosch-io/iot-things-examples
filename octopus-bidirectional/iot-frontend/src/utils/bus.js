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
    this.source = null;
  }

  fire(event, data = null) {
    if (event === "initSSE") {
      // start listening with a little timeout
      let values = Object.values(this.vue.items);
      let thingIds = values.map(element => element.thingId).join(",");
      this.source = new EventSourcePolyfill(
          `${this.vue.connection.http_endpoint}/api/2/things?ids=${thingIds}&x-cr-api-token=${this.vue.connection.api_token}&fields=thingId,policyId,attributes,features,_revision`,
          {
            headers: {
              Authorization: Api.getConfig().headers.Authorization
            },
            withCredentials: true
          }
        );
      this.source.onmessage = (sse) => {
        if (sse.data && sse.data.length > 0) {
          this.vue.$store.commit("incrementTelemetryCount");
          this.vue.$store.dispatch("telemetryUpdate", sse.data);
        }
      };
    } else if (event === "connectionError") {
      this.source.close();
    } else {
      this.vue.$emit(event, data);
    }
  }

  listen(event, callback) {
    this.vue.$on(event, callback);
  }
}());
