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
        md="8"
        lg="4"
        xl="3"
      >
        <v-card
          class="pa-2"
          rounded="lg"
          :flat="smAndDown"
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
          <v-card-title> 创建新主题 </v-card-title>

          <v-divider class="mt-2 mb-1" />

          <!-- form -->
          <v-card-text>
            <!-- alert -->
            <v-col
              cols="12"
              class="pa-0"
            >
              <v-alert
                v-model="warning.model"
                closable
                type="warning"
                variant="tonal"
                class="mb-5"
              >
                {{ warning.indication }}
              </v-alert>
              <v-alert
                v-model="error.model"
                closable
                type="error"
                variant="tonal"
                class="mb-5"
              >
                {{ error.indication }}
              </v-alert>
            </v-col>

            <v-form ref="formRef">
              <!-- name -->
              <v-col
                cols="12"
                class="pa-0 pb-1"
              >
                <v-text-field
                  v-model="form.name"
                  variant="outlined"
                  density="compact"
                  label="名称*"
                  :rules="[
                    val=>!!val || '名称不可为空！'
                  ]"
                  @blur="form.name = form.name.trim()"
                />
              </v-col>

              <!-- theme color -->
              <v-col
                cols="12"
                class="px-0 pb-1 pt-2"
              >
                <v-select
                  v-model="form.color"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  label="主题色*"
                  :items="colors"
                  item-title="color"
                  item-value="value"
                >
                  <template #item="{item:{title, value: val}}">
                    <v-list-item
                      @click="form.color = val"
                    >
                      <div
                        class="d-flex align-center"
                      >
                        <v-card
                          :color="title"
                          height="24"
                          width="24"
                          flat
                          rounded="lg"
                          class="mr-2"
                        />
                        {{ val }}
                      </div>
                    </v-list-item>
                  </template>
                  <template #selection="{item: {value: val, title}}">
                    <div
                      class="d-flex align-center"
                    >
                      <v-card
                        :color="title"
                        height="24"
                        width="24"
                        flat
                        rounded="lg"
                        class="mr-2"
                      />
                      {{ val }}
                    </div>
                  </template>
                </v-select>
              </v-col>

              <!-- low and high -->
              <v-col
                cols="12"
                class="px-0 d-flex align-center justify-space-between pb-1 pt-2"
              >
                <v-col
                  cols="6"
                  style="position: relative"
                  class="pa-0 pr-3"
                >
                  <v-text-field
                    v-model="form.low"
                    label="低值*"
                    variant="outlined"
                    density="compact"
                    type="number"
                    :rules="[
                      val => !!val || '低值不可为空！',
                      val => (+val <= (+form.high || val)) || '低值不可大于高值！'
                    ]"
                  />
                </v-col>
                <v-col
                  cols="6"
                  style="position: relative"
                  class="pa-0 pl-3"
                >
                  <v-text-field
                    v-model="form.high"
                    label="高值*"
                    variant="outlined"
                    density="compact"
                    type="number"
                    :rules="[
                      val=>!!val || '高值不可为空！',
                      val => (+val >= (+form.low || val)) || '高值不可低于高值！'
                    ]"
                  />
                </v-col>
              </v-col>

              <!-- indexes -->
              <v-col
                cols="12"
                class="px-0 pb-1 pt-2"
              >
                <v-select
                  v-model="form.indexes"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  label="统计指标*"
                  :items="indexes"
                  :rules="[
                    val=>!!val?.length || '统计指标不可为空！'
                  ]"
                  multiple
                />
              </v-col>
            </v-form>

            <!-- submit button -->
            <v-col
              cols="12"
              class="px-0 pb-0 pt-2"
            >
              <v-btn
                color="primary"
                block
                :loading="submitting"
                @click="submit"
              >
                提交
              </v-btn>
            </v-col>
          </v-card-text>
        </v-card>
      </v-col>
    </v-card>
  </v-dialog>
</template>
<script setup>
import {
  reactive, ref,
} from 'vue';
import { useDisplay } from 'vuetify';
import notify from '@/utils/notification';
import colorsJson from '@/assets/colors.json';
import { useStore } from 'vuex';
import AV from 'leancloud-storage';

// props & emit
defineProps({
  value: {
    type: Boolean,
    default: () => false,
  },
});
const emit = defineEmits(['update:modelValue', 'reload']);

// reactive
const { smAndDown } = useDisplay();
const store = useStore();
const submitting = ref(false);
const indexes = ref(['平均值', '总计', '最值']);
const formRef = ref(null);
const colors = reactive(colorsJson);
const form = reactive({
  low: null,
  high: null,
  color: 'green',
  name: '',
  indexes: [],
});
const error = reactive({
  model: false,
  indication: '',
});
const warning = reactive({
  model: false,
  indication: '',
});

async function createTheme() {
  const Theme = AV.Object.extend('Theme');
  const theme = new Theme();
  theme.set('name', form.name);
  theme.set('color', form.color);
  theme.set('low', +form.low);
  theme.set('high', +form.high);
  theme.set('indexes', form.indexes);
  await theme.save();
}

async function checkRepeat() {
  try {
    const query = new AV.Query('Theme');
    const result = await query.equalTo('name', form.name).find();
    return result.length > 0;
  } catch {
    // theme does't exist yet
    return false;
  }
}

async function submit() {
  const { valid } = await formRef.value.validate();
  if (valid) {
    submitting.value = true;
    try {
      const repeat = await checkRepeat();
      if (repeat) {
        warning.model = true;
        warning.indication = '同名主题已存在！';
      } else {
        await createTheme();
        emit('update:modelValue', false);
        emit('reload');
        notify.success(store, '主题已创建');
      }
    } catch (err) {
      error.model = true;
      error.indication = err?.message || 'Unknown Exception.';
    }

    submitting.value = false;
  } else {
    warning.model = true;
    warning.indication = '请先确保输入有效！';
  }
}
</script>
