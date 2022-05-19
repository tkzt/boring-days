<template>
  <v-app>
    <notification />
    <v-main style="background-color: #f2f3f8">
      <router-view />
      <v-overlay
        v-model="store.state.loading"
        class="d-flex align-center justify-center"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </v-overlay>
    </v-main>
  </v-app>
</template>
<script setup>
import { useStore } from 'vuex';
import Notification from '@/components/Notification.vue';

const store = useStore();
</script>
<style>
html {
    background-color: #f2f3f8 !important;
    overflow: auto;
}

.v-snackbar__wrapper{
  min-width: max-content;
  min-height: 32px;
}

.v-snackbar__content {
  padding: 8px 12px;
}

/* somehow overlay content max-height has been preseted as 360px */
/* which is confusing */
.v-dialog .v-overlay__content {
  max-height: unset !important;
}
</style>
