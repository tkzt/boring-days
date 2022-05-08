<template>
  <v-dialog
    :model-value="value"
    :fullscreen="smAndDown"
    class="d-flex align-center justify-center"
  >
    <v-card color="white">
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
      <v-card-title class="pb-0 pr-1">
        编辑主题
      </v-card-title>
      <v-card-text :class="{'mt-3': smAndDown}">
        <!-- alert -->
        <v-col
          cols="12"
          class="py-0"
        >
          <v-alert
            v-model="error.model"
            type="error"
            variant="contained-text"
            closable
          >
            {{ error.indication }}
          </v-alert>
        </v-col>
        <v-col
          cols="12"
          class="py-0"
          :class="{'mt-4': error.model}"
        >
          <v-alert
            v-model="warning.model"
            type="warning"
            variant="contained-text"
            closable
          >
            {{ warning.indication }}
          </v-alert>
        </v-col>

        <!-- name -->
        <v-col
          cols="12"
          class="py-0"
          :class="{'mt-6': error.model || warning.model}"
        >
          <v-text-field
            v-model="form.name"
            variant="outlined"
            density="comfortable"
            label="名称*"
            :error-messages="errorMessages.name"
            @blur="validate('name')"
            @input="resetValidation('name')"
          />
        </v-col>

        <!-- theme color -->
        <v-col
          cols="12"
          class="py-0 d-flex align-center justify-space-between"
          style="margin-bottom: 38px"
        >
          <div
            style="color: #a3a3a3; font-size: 12px"
            class="flex-shrink-0 pr-3 flex-grow-0"
          >
            主题色:
          </div>
          <div class="d-flex align-center flex-wrap">
            <div
              v-for="item, index in colors"
              :key="index"
              class="rect d-flex align-center justify-center"
              :style="{
                backgroundColor: item.color,
                marginRight: index<colors.length-1?'5px':''
              }"
              @click="form.color = item.value"
            >
              <v-icon
                v-if="form.color===item.value"
                size="12"
                color="white"
                class="flex-grow-0"
              >
                mdi-check
              </v-icon>
            </div>
          </div>
        </v-col>

        <!-- low and high -->
        <v-col
          cols="12"
          class="py-0 d-flex align-center justify-space-between"
          style="margin-bottom: 38px"
        >
          <v-col
            cols="5"
            style="position: relative"
            class="pa-0 d-flex bordered-col"
            :class="{'error-col': errorMessages.low.length>0}"
          >
            <label
              class="label"
              :class="{'label-rise-up': lowFocused || hasValue(form.low)}"
            >
              低值*
            </label>
            <div
              class="overflow-hidden flex-grow-1"
              style="padding: 0 16px"
            >
              <input
                v-model="form.low"
                step="0.01"
                class="customized-input"
                type="number"
                @focus="lowFocused = true"
                @blur="lowFocused = false; validate('low')"
                @input="resetValidation('low')"
              >
            </div>
            <div
              v-if="!!errorMessages.low"
              class="error-message"
            >
              {{ errorMessages.low }}
            </div>
          </v-col>
          <v-icon
            size="15"
            class="mx-4"
          >
            mdi-arrow-right
          </v-icon>
          <v-col
            cols="5"
            style="position: relative"
            class="pa-0 d-flex bordered-col"
            :class="{'error-col': errorMessages.high.length>0}"
          >
            <label
              class="label"
              :class="{'label-rise-up': highFocused || hasValue(form.high)}"
            >
              高值*
            </label>
            <div
              class="overflow-hidden flex-grow-1"
              style="padding: 0 16px"
            >
              <input
                v-model="form.high"
                step="0.01"
                class="customized-input"
                type="number"
                @focus="highFocused = true"
                @blur="highFocused = false; validate('high')"
                @input="resetValidation('high')"
              >
            </div>
            <div
              v-if="!!errorMessages.high"
              class="error-message"
            >
              {{ errorMessages.high }}
            </div>
          </v-col>
        </v-col>

        <!-- indexes -->
        <v-col
          cols="12"
          class="py-0"
          :class="{'mt-6': error.model || warning.model}"
        >
          <v-select
            v-model="form.indexes"
            variant="outlined"
            density="comfortable"
            label="统计指标"
            :items="indexes"
            multiple
          />
        </v-col>

        <!-- submit button -->
        <v-col
          cols="12"
          class="py-0 mb-4"
        >
          <v-btn
            color="primary"
            block
            :disabled="submitting"
            @click="submit"
          >
            <v-progress-circular
              v-if="submitting"
              indeterminate
              width="2"
              size="20"
            />
            <template v-else>
              提交
            </template>
          </v-btn>
        </v-col>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup>
import {
  reactive, ref, watchEffect,
} from 'vue';
import { useDisplay } from 'vuetify';
import { hasValue } from '@/utils/common';
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

// static
const fieldLabelMap = {
  low: '低值',
  high: '高值',
  color: '主题色',
  name: '名称',
};

// reactive
const { smAndDown } = useDisplay();
const store = useStore();
const lowFocused = ref(false);
const highFocused = ref(false);
const submitting = ref(false);
const indexes = ref(['平均值', '总计', '最值']);
const colors = reactive(colorsJson);
const form = reactive({
  low: null,
  high: null,
  color: 'green',
  name: '',
  indexes: [],
});
const errorMessages = reactive({
  low: '',
  high: '',
  color: '',
  name: '',
});
const error = reactive({
  model: false,
  indication: '',
});
const warning = reactive({
  model: false,
  indication: '',
});

// funcs
function resetValidation(field = 'all') {
  let fields;
  if (field === 'all') {
    fields = Object.keys(form);
  } else {
    fields = [field];
  }

  fields.forEach((f) => { errorMessages[f] = ''; });
}

function validate(field = 'all') {
  let fields;
  let valid = true;
  if (field === 'all') {
    fields = Object.keys(form);
  } else {
    fields = [field];
  }

  fields.forEach((f) => {
    if (!hasValue(form[f])) {
      errorMessages[f] = `${fieldLabelMap[f]} 不可为空`;
      valid = false;
    }
  });

  if (valid && field === 'all' && form.low >= form.high) {
    errorMessages.low = `${fieldLabelMap.low} 应小于 ${fieldLabelMap.high}`;
    errorMessages.high = `${fieldLabelMap.high} 应大于 ${fieldLabelMap.low}`;
    valid = false;
  }

  return valid;
}

async function updateTheme(themeId) {
  const theme = AV.Object.createWithoutData('Theme', themeId);
  theme.set('name', form.name);
  theme.set('color', form.color);
  theme.set('low', form.low);
  theme.set('high', form.high);
  theme.set('indexes', form.indexes);
  await theme.save();
}

async function checkRepeat(themeId) {
  const query = new AV.Query('Theme');
  const result = await query.equalTo('name', form.name).find();
  return result.some((t) => t.id !== themeId);
}

async function submit() {
  const valid = validate();
  if (valid) {
    submitting.value = true;
    try {
      const { id } = props.theme;
      const repeat = await checkRepeat(id);
      if (repeat) {
        warning.model = true;
        warning.indication = '同名主题已存在';
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
    warning.indication = '请先确保输入有效';
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
