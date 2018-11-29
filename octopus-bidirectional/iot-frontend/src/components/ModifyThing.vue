<template>
  <div class="card shadow m-bottom-24px">
    <div
      class="card-body lead"
      v-show="isSelected.thingId === undefined && isSelected !== 'newItem'"
    >No thing selected</div>
    <div v-show="isSelected.thingId !== undefined || isSelected === 'newItem'">
      <div
        class="card-header lead"
        v-show="isSelected.thingId !== undefined && isSelected.thingId !== 'newThing'"
      >{{ isSelected.thingId }}</div>
      <div class="card-header lead" v-show="isSelected.thingId === 'newThing'">
        <input class="form-control" v-model="isSelected.thingId">
      </div>
      <codemirror
        id="thing"
        :options="cmOptions"
        :value="JSON.stringify(isSelected, null, '\t')"
        @input="updateThing($event)"
        class="border-bottom"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view :alert="this.alert" alert-id="saveChanges"></alert-view>
          </div>
          <div class="row">
            <button
              @click="saveChanges"
              v-show="isSelected.thingId !== undefined"
              type="button"
              class="btn btn-outline-success col-md-4"
            >
              <font-awesome-icon style="margin-right: 5px;" icon="save"></font-awesome-icon>Save changes
            </button>
          </div>
        </div>
      </div>
      <codemirror
        id="sendMessage"
        :options="cmOptions"
        :value="JSON.stringify(message, null, '\t')"
        class="border-bottom border-top"
      ></codemirror>
      <div class="card-body">
        <div class="container">
          <div class="row">
            <alert-view :alert="this.alert" alert-id="sendMessage"></alert-view>
          </div>
          <div class="row">
            <button
              id="sendButton"
              @click="sendMessage"
              type="button"
              class="btn btn-outline-primary col-md-4"
            >
              <font-awesome-icon style="margin-right: 5px;" icon="upload"/>Send message
            </button>
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
        topic: "komplett",
        payload: "Hello World"
      }
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
    userData: {
      get() {
        return this.$store.getters.getUserData;
      }
    },
    auth: {
      get() {
        return this.$store.getters.getAuth;
      }
    }
  },
  methods: {
    saveChanges() {
      this.$store
        .dispatch("saveChanges", JSON.parse(this.localcopy))
        .then(res => {
          this.showAlert(true, "saveChanges", "Successfully saved.");
          this.$store.dispatch("getAllThings");
        })
        .catch(err =>
          this.showAlert(false, "saveChanges", "Error - Status " + res.status)
        );
    },
    deleteThing() {
      this.$store.dispatch("deleteThing", this.isSelected);
    },
    updateThing(event) {
      this.localcopy = event;
    },
    sendMessage() {
      this.$store
        .dispatch("sendMessage", this.message)
        .then(res => {
          this.showAlert(true, "sendMessage", "Device got Message.");
          this.dispatch("getAllThings");
        })
        .catch(err => {
          this.showAlert(false, "sendMessage", "Something went wrong.");
        });
    },
    showAlert(isOkay, alertId, alertMessage) {
      this.alert.alertId = alertId;
      this.alert.successMessage = alertMessage;
      if (isOkay) {
        this.alert.isSuccess = true;
      } else {
        this.alert.isError = true;
      }
      setTimeout(() => {
        this.alert.alertId = "";
        this.alert.isSuccess = false;
        this.alert.isError = false;
        this.alert.successMessage = "";
        this.alert.errorMessage = "";
      }, 2000);
    }
  }
};
</script>

<style>
.m-bottom-24px {
  margin-bottom: 24px;
}
</style>