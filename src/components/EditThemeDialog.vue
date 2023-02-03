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
          <v-card-title> 编辑主题 </v-card-title>

          <v-divider class="mt-2 mb-1" />

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
  reactive, ref, watchEffect,
} from 'vue';
import { useDisplay } from 'vuetify';
import notify from '@/utils/notification';
import colorsJson from '@/assets/colors.json';
import { useStore } from 'vuex';
import AV from 'leancloud-storage';

// props & emit
const props = defineProps({
  value: {
    type: Boolean,
    default: () => false,
  },
  theme: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['update:modelValue', 'reload']);

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

async function updateTheme(themeId) {
  const theme = AV.Object.createWithoutData('Theme', themeId);
  theme.set('name', form.name);
  theme.set('color', form.color);
  theme.set('low', +form.low);
  theme.set('high', +form.high);
  theme.set('indexes', form.indexes);
  await theme.save();
}

async function checkRepeat(themeId) {
  const query = new AV.Query('Theme');
  const result = await query.equalTo('name', form.name).find();
  return result.some((t) => t.id !== themeId);
}

async function submit() {
  const { valid } = await formRef.value.validate();
  if (valid) {
    submitting.value = true;
    try {
      const { id } = props.theme;
      const repeat = await checkRepeat(id);
      if (repeat) {
        warning.model = true;
        warning.indication = '同名主题已存在！';
      } else {
        await updateTheme(id);
        emit('update:modelValue', false);
        emit('reload');
        notify.success(store, '更新已保存');
      }
    } catch (err) {
      error.model = true;
      error.indication = err;
    }

    submitting.value = false;
  } else {
    warning.model = true;
    warning.indication = '请先确保输入有效！';
  }
}

watchEffect(() => {
  const { attributes } = props.theme;
  if (attributes) {
    Object.assign(form, attributes);
  }
});
</script>
<style scoped>
.rect{
  width: 25px;
  height: 15px;
  border-radius: 4px;
  margin: 2.5px 0;
  cursor: pointer;
}

.customized-input{
  width: 100%;
  outline: none;
  height: 48px;
  color: #7a7a7a;
}

.customized-input::placeholder{
  color: #a3a3a3;
}

.bordered-col{
  border: thin solid #c5c5c5;
  border-radius: 4px;
  box-sizing: border-box;
}

.bordered-col:hover{
  border-color: #7a7a7a;
}

.bordered-col:focus-within{
  border-color: #666;
  border-width: 2px;
}

.bordered-col:focus-within .customized-input{
  height: 46px;
}

.bordered-col:focus-within .label{
  color: #666;
}

.error-col,
.error-col:focus-within,
.error-col .label,
.error-col:focus-within .label,
.error-col:hover {
  border-color: #bf3946;
  color: #bf3946;
}

.label {
  pointer-events: none;
  position: absolute;
  top: 12px;
  display: flex;
  align-items: center;
  color: #a3a3a3;
  margin: 0 16px;
  transform-origin: 0 12px;
  transition-duration: .15s;
  transition-timing-function: cubic-bezier(.4, 0, .2, 1);
}

.label-rise-up {
  top: -12px;
  font-size: 12px;
  background-color: #fff;
  height: 24px;
  padding: 0 5px;
  margin: 0 11px;
}

.error-message{
  position: absolute;
  padding: 6px 16px 0 16px;
  top: 50px;
  font-size: 12px;
  color: #bf3946;
}

.error-col:focus-within .error-message{
  top: 49px;
  padding-left: 15px;
}
</style>
