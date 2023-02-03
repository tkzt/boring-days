<template>
  <v-dialog
    :model-value="value"
    :fullscreen="smAndDown"
  >
    <v-card
      flat
      class="d-flex justify-center align-center"
      :color="smAndDown?'':'transparent'"
      elevation="0"
    >
      <v-col
        class="pa-0"
        cols="12"
        md="4"
        lg="3"
        xl="2"
      >
        <v-card
          class="pa-2"
          :flat="smAndDown"
          rounded="lg"
        >
          <!-- close button -->
          <v-btn
            icon
            elevation="0"
            size="small"
            class="ma-3"
            position="absolute"
            location="top end"
            @click="emit('update:modelValue', false)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>

          <!-- title -->
          <v-card-title>
            关于
          </v-card-title>

          <v-divider class="mt-2 mb-1" />

          <!-- text -->
          <v-card-text>
            这是一个朴素的记账类小工具，主要基于：
            <div class="my-3 pl-2">
              <p>
                -
                <a
                  href="https://vuejs.org/"
                  target="_blank"
                >Vue 3</a>
              </p>
              <p>
                -
                <a
                  href="https://next.vuetifyjs.com/en/"
                  target="_blank"
                >Vuetify 3</a>
              </p>
              <p>
                -
                <a
                  href="https://vitejs.dev/"
                  target="_blank"
                >Vite 4</a>
              </p>
              <p>
                -
                <a
                  href="https://leancloud.app/"
                  target="_blank"
                >LeanCloud</a>
              </p>
            </div>
            <div
              class="text-caption"
            >
              <span>
                View on
                <a
                  href="https://github.com/boring-plans/boring-days"
                  target="_blank"
                >GitHub</a>.
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { useDisplay } from 'vuetify';

defineProps({
  value: Boolean,
});
const emit = defineEmits(['update:modelValue']);
const { smAndDown } = useDisplay();
</script>
