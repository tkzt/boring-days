<template>
  <v-dialog
    :model-value="value"
  >
    <v-card
      flat
      class="d-flex justify-center align-center"
      color="transparent"
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
          <!-- title -->
          <v-card-title>删除确认</v-card-title>

          <v-divider class="mt-2 mb-1" />

          <v-card-text
            class="d-flex align-center"
          >
            <v-icon
              color="warning"
              class="mr-2"
            >
              mdi-information
            </v-icon>
            确认删除主题“{{ theme?.attributes.name }}”?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="emit('update:modelValue', false)">
              取消
            </v-btn>
            <v-btn
              color="error"
              :loading="submitting"
              @click="submit"
            >
              确认
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref } from 'vue';
import AV from 'leancloud-storage';
import notify from '@/utils/notification';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';

const props = defineProps({
  theme: {
    type: Object,
    default: () => null,
  },
  value: Boolean,
});
const emit = defineEmits(['update:modelValue', 'reload']);

const store = useStore();
const submitting = ref(false);
const { smAndDown } = useDisplay();

async function submit() {
  submitting.value = true;
  const theme = AV.Object.createWithoutData('Theme', props.theme.id);
  await theme.destroy();
  submitting.value = false;
  notify.success(store, '主题已删除');
  emit('update:modelValue', false);
  emit('reload');
}
</script>
