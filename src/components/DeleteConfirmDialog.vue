<template>
  <v-dialog
    :model-value="value"
  >
    <v-card width="280">
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
        删除确认
      </v-card-title>
      <v-card-text
        class="d-flex align-center"
        style="font-size: 14px;"
      >
        <v-icon
          color="warning"
          class="mr-2"
        >
          mdi-information
        </v-icon>
        确认删除主题「{{ theme && theme.attributes.name }}」?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="emit('update:modelValue', false)">
          取消
        </v-btn>
        <v-btn
          color="error"
          @click="submit"
        >
          <v-progress-circular
            v-if="submitting"
            indeterminate
            width="2"
            size="20"
          />
          <template v-else>
            确认
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref } from 'vue';
import AV from 'leancloud-storage';
import { success } from '@/utils/notification';
import { useStore } from 'vuex';

const props = defineProps({
  theme: {
    type: String,
    default: () => '',
  },
});
const emit = defineEmits(['update:modelValue', 'reload']);

const store = useStore();
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  const theme = AV.Object.createWithoutData('Theme', props.theme.id);
  await theme.destroy();
  submitting.value = false;
  success(store, '主题已删除');
  emit('update:modelValue', false);
  emit('reload');
}
</script>
