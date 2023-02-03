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
          <v-card-title>
            <template
              v-if="!isEditing"
            >
              创建新纪录
            </template>
            <template v-else>
              编辑记录
            </template>
          </v-card-title>

          <v-divider class="mt-2 mb-1" />

          <v-card-text>
            <!-- alert -->
            <v-col
              cols="12"
              class="pa-0"
            >
              <v-alert
                v-model="error.model"
                type="error"
                variant="tonal"
                closable
                class="mb-5"
              >
                {{ error.indication }}
              </v-alert>
              <v-alert
                v-model="warning.model"
                type="warning"
                variant="tonal"
                closable
                class="mb-5"
              >
                {{ warning.indication }}
              </v-alert>
            </v-col>

            <!-- theme -->
            <v-col
              cols="12"
              class="pa-0 pb-1"
            >
              <v-select
                v-model="form.theme"
                :readonly="isEditing"
                hint="This field is readonly when editing."
                variant="outlined"
                density="compact"
                label="主题*"
                :items="themes"
                no-data-text="请先创建主题"
              />
            </v-col>

            <v-form ref="formRef">
              <!-- date -->
              <v-col
                cols="12"
                class="px-0 pb-1 pt-2"
              >
                <v-text-field
                  v-model="form.date"
                  variant="outlined"
                  density="compact"
                  label="日期*"
                  hint="This is a readonly field."
                  readonly
                />
              </v-col>

              <!-- value -->
              <v-col
                cols="12"
                class="px-0 pb-1 pt-2"
              >
                <v-text-field
                  v-model="form.value"
                  variant="outlined"
                  density="compact"
                  label="数值*"
                  :rules="[
                    val=>!!val || '数值不可为空！'
                  ]"
                  :hint="
                    tempSum.length?
                      `sum: ${tempSum.reduce((pre, curr)=>pre+curr, 0)
                      }(${tempSum.map(t=>t>0?'+'+t:t).join('')})`:
                      ''
                  "
                  type="number"
                  validate-on="blur"
                  @keypress.enter="
                    tempSum.push(+form.value);
                    form.value='';
                  "
                  @blur="
                    form.value = tempSum.reduce((pre, curr)=>pre+curr, 0)+'';
                    tempSum = []
                  "
                />
              </v-col>

              <!-- comment -->
              <v-col
                cols="12"
                class="px-0 pb-1 pt-2"
              >
                <v-textarea
                  v-model="form.comment"
                  variant="outlined"
                  density="compact"
                  label="备注"
                  @blur="form.comment = form.comment.trim()"
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
  computed, reactive, ref, watchEffect,
} from 'vue';
import { useDisplay } from 'vuetify';
import notify from '@/utils/notification';
import dayjs from 'dayjs';
import { useStore } from 'vuex';
import AV from 'leancloud-storage';

// props & emit
const props = defineProps({
  value: {
    type: Boolean,
    default: () => false,
  },
  themes: {
    type: Array,
    default: () => [],
  },
  editing: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue', 'reload']);

// reactive
const { smAndDown } = useDisplay();
const store = useStore();
const submitting = ref(false);
const formRef = ref(null);
const form = reactive({
  theme: '',
  date: '',
  value: '',
  comment: '',
});
const tempSum = reactive([]);
const error = reactive({
  model: false,
  indication: '',
});
const warning = reactive({
  model: false,
  indication: '',
});

const isEditing = computed(() => JSON.stringify(props.editing) !== JSON.stringify({}));

async function getTheme() {
  const query = new AV.Query('Theme');
  return query.equalTo('name', form.theme).find();
}

async function createRecord() {
  const Record = AV.Object.extend('Record');
  const record = new Record();
  const theme = await getTheme();
  record.set('theme', theme);
  record.set('comment', form.comment);
  record.set('value', +form.value);
  record.set('date', new Date(form.date));
  await record.save();
}

async function updateRecord(id) {
  const record = AV.Object.createWithoutData('Record', id);
  record.set('value', +form.value);
  record.set('comment', form.comment);
  await record.save();
}

async function getExist() {
  try {
    const queryTheme = new AV.Query('Record');
    const queryDate = new AV.Query('Record');
    const [theme] = await getTheme();
    queryTheme.equalTo('theme', theme);
    queryDate.equalTo(
      'date',
      new Date(dayjs(form.date).format('YYYY-MM-DD')),
    );
    const [result] = await AV.Query.and(queryTheme, queryDate).find();
    return result || {};
  } catch {
    // Record 尚未创建
    return {};
  }
}

async function submit() {
  const { valid } = await formRef.value.validate();
  if (valid) {
    submitting.value = true;
    try {
      const { id } = await getExist();
      if (id) {
        await updateRecord(id);
      } else {
        await createRecord();
      }
      emit('update:modelValue', false);
      emit('reload', form.theme);
      notify.success(store, '已提交');
    } catch (err) {
      error.model = true;
      error.indication = err.message || 'Unknown Exception.';
    }
    submitting.value = false;
  } else {
    warning.model = true;
    warning.indication = '请先确保输入有效！';
  }
}

watchEffect(() => {
  const mixed = {};
  Object.assign(mixed, {
    theme: props.themes[0],
    date: dayjs().format('YYYY-MM-DD'),
    value: '',
    comment: '',
  });
  Object.assign(mixed, props.editing);
  Object.assign(form, mixed);
});
</script>
