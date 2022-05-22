<template>
  <v-snackbar
    v-model="store.state.notification.model"
    app
    timeout="3000"
    style="margin-bottom: 8vh;"
  >
    <div class="d-flex align-center text-caption">
      <v-icon
        v-if="store.state.notification.level"
        class="mr-2"
        size="small"
        :color="store.state.notification.level"
      >
        {{ iconLevelMap[store.state.notification.level] }}
      </v-icon>
      {{ store.state.notification.content }}
    </div>
  </v-snackbar>
</template>
<script setup>
import { reactive } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const iconLevelMap = reactive({
  info: 'mdi-information',
  warning: 'mdi-alert',
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
});
</script>
