<template>
  <div class="width-100">
    <div v-show="alert.alertId === alertId ? true : false">
      <div
        v-show="alert.isSuccess"
        class="alert alert-success"
        role="alert"
      >{{ alert.successMessage }}</div>
      <div v-show="alert.isError" class="alert alert-danger" role="alert">{{ alert.errorMessage }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "alert-view",
  props: ["alert", "alertId"]
};
</script>

<style>
.width-100 {
  width: 100%;
}
</style>