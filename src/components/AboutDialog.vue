<template>
  <v-dialog
    :model-value="value"
  >
    <v-card
      class="pb-3"
      width="280"
    >
      <!-- close button -->
      <v-btn
        icon
        elevation="0"
        size="small"
        class="ma-1"
        style="position: absolute; right: 0; top: 0"
        @click="emit('update:modelValue', false)"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>

      <!-- title -->
      <v-card-title>
        关于
      </v-card-title>
      <v-card-text
        class="pt-0"
        style="font-size: 14px;"
      >
        <p>
          这是一个基于 Vue 3, Vuetify 3 Beta, Vite 2 以及 Lean Cloud 的小玩具。
        </p>
        <p>
          REPO link:
          <v-btn
            icon
            elevation="0"
            size="small"
            href="https://github.com/boring-plans/boring-days"
          >
            <v-icon size="small">
              mdi-github
            </v-icon>
          </v-btn>
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup>
const emit = defineEmits(['update:modelValue']);
</script>
