<template>
  <div v-if="isReady" class="card shadow m-bottom-24px">
    <div class="card-body lead" v-show="!isReady">No thing selected</div>
    <div v-show="isReady">
      <div class="card-header lead">{{ items[isSelected.thingId].thingId }}</div>
      <codemirror
        id="thing"
        :options="cmOptions"
        :value="JSON.stringify(items[isSelected.thingId], null, '\t')"
        class="border-bottom"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view :alert="this.alert" alert-id="saveChanges"></alert-view>
          </div>
          <div class="row">
            <span class="lead">Command & Control</span>
          </div>
        </div>
      </div>
      <codemirror
        id="sendMessage"
        :options="cmOptions"
        :value="JSON.stringify(message, null, '\t')"
        @input="updateMessage($event)"
        class="border-bottom border-top"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view class="middle-out" :alert="this.alert" alert-id="sendMessage"></alert-view>
          </div>
          <div class="row" style="margin-bottom: 18px;">
            <button
              id="sendButton"
              @click="sendMessage"
              type="button"
              class="btn btn-outline-primary col middle-out"
              :disabled="isSending"
            >
              <font-awesome-icon style="margin-right: 5px;" icon="upload"/>Send message
            </button>
          </div>

          <div class="row">
            <div class="input-group col">
              <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Topic</span>
              </div>
              <input class="form-control" type="text" placeholder="topic" v-model="topic">
            </div>
            <div class="input-group col">
              <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Cor-Id</span>
              </div>
              <input
                class="form-control"
                type="text"
                placeholder="Correlation id"
                v-model="correlation"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { codemirror } from "vue-codemirror";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/addon/selection/active-line.js";
import AlertView from "./shared/AlertView.vue";

export default {
  name: "ModifyThing",
  components: {
    codemirror,
    AlertView
  },
  data() {
    return {
      isReady: false,
      isSending: false,
      localcopy: {},
      cmOptions: {
        theme: "idea",
        tabSize: 2,
        mode: "application/json",
        lineNumbers: true,
        matchBrackets: true,
        line: false,
        lines: 1,
        lineWrapping: true
      },
      alert: {
        alertId: "",
        isSuccess: false,
        isError: false,
        successMessage: "",
        errorMessage: ""
      },
      message: {
        r: 0,
        g: 0,
        b: 0,
        w: 0
      },
      topic: "switch_led",
      correlation: "message-example"
    };
  },
  computed: {
    isSelected: {
      get() {
        return this.$store.getters.getSelected;
      },
      set(value) {
        this.$store.commit("setSelected", value);
      }
    },
    items: {
      get() {
        return this.$store.getters.getItems;
      }
    },
    isConnected: {
      get() {
        return this.$store.getters.getConnectionStatus;
      }
    }
  },
  watch: {
    isSelected: function(val) {
      this.isReady = true;
    },
    isConnected: function(val) {
      if (!val) {
        this.isReady = false;
      }
    }
  },
  methods: {
    updateMessage(event) {
      try {
        this.isSending = false;
        this.message = JSON.parse(event);
      } catch (e) {
        if (e) {
          this.isSending = true;
          this.showAlert(false, "sendMessage", "JSON not valid");
        }
      }
    },
    sendMessage() {
      this.isSending = true;
      this.$store
        .dispatch("sendMessage", {
          message: this.message,
          topic: this.topic,
          corrId: this.correlation
        })
        .then(res => {
          this.showAlert(
            true,
            "sendMessage",
            `Response: ${JSON.stringify(res.data)}`
          );
          this.isSending = false;
        })
        .catch(err => {
          this.isSending = false;
          this.showAlert(false, "sendMessage", err.message);
        });
    },
    showAlert(isOkay, alertId, alertMessage) {
      this.alert.alertId = alertId;
      if (isOkay) {
        this.alert.isSuccess = true;
        this.alert.successMessage = alertMessage;
      } else {
        this.alert.isError = true;
        this.alert.errorMessage = alertMessage;
      }
      setTimeout(() => {
        this.alert.alertId = "";
        this.alert.isSuccess = false;
        this.alert.isError = false;
        this.alert.successMessage = "";
        this.alert.errorMessage = "";
      }, 5000);
    }
  }
};
</script>

<style>
.CodeMirror {
  height: 600px;
}

#sendMessage .CodeMirror {
  height: 160px;
}

.m-bottom-24px {
  margin-bottom: 24px;
}

.middle-out {
  margin-right: 15px;
  margin-left: 15px;
}
</style>
