<template>
  <v-app>
    <notification />
    <v-main :style="{'background-color': theme.global.current.value.dark?'':'#f2f3f8'}">
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
import Notification from '@/components/NotificationBar.vue';
import { onMounted } from 'vue';
import { useTheme } from 'vuetify';

const store = useStore();
const theme = useTheme();

onMounted(() => {
  const cachedTheme = localStorage.getItem('colorTheme');

  if (cachedTheme) {
    theme.global.name.value = cachedTheme;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.global.name.value = 'dark';
  }
});
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

/* somehow overlay content max-height has been preseted as 360px
which is confusing */
.v-dialog .v-overlay__content {
  max-height: unset !important;
}

/* temporarily fix another vuetify-beta bug */
div.v-overlay.v-overlay--absolute.v-overlay--active.v-menu {
  z-index: 99999 !important;
}

/* also, text in plain textfield is not center aligned in vertical
due to asymmetrical padding */
.v-text-field .v-field__field {
  padding: 9px 0;
}

.v-select .v-field__field{
  padding: 12px 6px;
}
</style>
