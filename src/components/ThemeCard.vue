<template>
  <v-card
    ref="theCardRef"
    class="d-flex flex-wrap overflow-visible"
    style="position: relative"
    :style="{ padding: padding + 'px' }"
    flat
    rounded="lg"
  >
    <div
      class="d-flex mb-2 text-caption align-center"
      style="width: 100%; height: 12px"
    >
      <div
        style="font-weight: bold; cursor: pointer"
        @mouseenter="mdAndUp && showIndexes()"
        @mouseleave="mdAndUp && (indexes.show = false)"
        @click="!mdAndUp && showIndexes()"
      >
        {{ props.theme?.attributes.name || '' }}
      </div>
      <div
        v-click-outside="{
          handler: () => (indexes.show = false),
          closeConditional: () => indexes.show,
        }"
      >
        <v-tooltip
          v-model="indexes.show"
          location="end top"
          activator="parent"
          :offset="[5, 5]"
        >
          <div class="text-caption">
            <template v-if="indexes.result?.length">
              <div class="d-flex align-center">
                <v-divider class="ma-1 ml-0" />
                年
                <v-divider class="ma-1 mr-0" />
              </div>
              <div v-for="(i, idx) in indexes.result" :key="idx" class="d-flex">
                {{ i.index }}<v-spacer /><strong class="ml-2">{{
                  i.value.toFixed(2)
                }}</strong>
              </div>
              <template v-if="indexes.monthResult?.length">
                <div class="d-flex align-center">
                  <v-divider class="ma-1 ml-0" />
                  月
                  <v-divider class="ma-1 mr-0" />
                </div>
                <div
                  v-for="(i, idx) in indexes.monthResult"
                  :key="idx"
                  class="d-flex"
                >
                  {{ i.index }}<v-spacer /><strong class="ml-2">{{
                    i.value.toFixed(2)
                  }}</strong>
                </div>
              </template>
            </template>
            <template v-else> 无统计指标或无数据~ </template>
          </div>
        </v-tooltip>
      </div>
      <v-spacer />
      <v-menu v-model="rightClickMenu" anchor="start top">
        <template #activator="{ props: p }">
          <v-btn size="24" icon v-bind="p" flat>
            <v-icon style="cursor: pointer"> mdi-dots-horizontal </v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item class="text-caption" @click="editDialog = true">
            编辑
          </v-list-item>
          <v-list-item
            class="text-caption text-error"
            @click="deleteDialog = true"
          >
            删除
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <template v-if="!empty">
      <template
        v-for="([date, day], idx) in Object.entries(days).sort(([k1], [k2]) =>
          k1 > k2 ? 1 : -1,
        )"
        :key="idx"
      >
        <day-card
          v-if="mdAndUp"
          :day="{
            ...day,
            date,
            color: calcColor(day.value),
          }"
          @click="
            emit('editDay', {
              ...day,
              date,
            })
          "
        />
        <day-card
          v-else
          :day="{
            ...day,
            date,
            color: calcColor(day.value),
          }"
          @edit-day="
            emit('editDay', {
              ...day,
              date,
            })
          "
        />
      </template>
    </template>
    <div v-else class="text-caption">无数据～</div>

    <v-overlay
      :model-value="loading"
      contained
      class="d-flex align-center justify-center"
      :scrim="
        theme.global.current.value.dark
          ? 'rgba(255, 255, 255, .17)'
          : 'rgba(0, 0, 0, .37)'
      "
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="small"
        width="2"
      />
    </v-overlay>
  </v-card>
  <delete-confirm-dialog
    v-model="deleteDialog"
    :theme="props.theme"
    @reload="emit('reloadAll')"
  />
  <edit-theme-dialog
    v-model="editDialog"
    :theme="props.theme"
    @reload="emit('reloadCurrent', props.theme.id)"
  />
</template>
<script setup>
import { onMounted, ref, computed, reactive, watch, nextTick } from 'vue';
import colorsJson from '@/assets/colors.json';
import dayjs from 'dayjs';
import AV from 'leancloud-storage';
import notify from '@/utils/notification';
import { useStore } from 'vuex';
import { useDisplay, useTheme } from 'vuetify';
import DayCard from './DayCard.vue';
import DeleteConfirmDialog from './DeleteConfirmDialog.vue';
import EditThemeDialog from './EditThemeDialog.vue';

// props & emit
const props = defineProps({
  theme: {
    type: Object,
    default: () => null,
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
});

const emit = defineEmits(['reloadAll', 'reloadCurrent', 'editDay']);

// reactive
const { mdAndUp } = useDisplay();
const store = useStore();
const theme = useTheme();
const theCardRef = ref(null);
const padding = ref(0);
const unit = ref(0);
const loading = ref(false);
const loadingHeight = ref(0);
const deleteDialog = ref(false);
const editDialog = ref(false);
const rightClickMenu = ref(false);
const indexes = reactive({ show: false, result: [], monthResult: [] });
const days = reactive({});

const colors = computed(
  () =>
    props.theme &&
    colorsJson.find((c) => c.value === props.theme.attributes.color).colors,
);
const empty = computed(
  () =>
    !loading.value && Object.values(days).every((d) => d.value === undefined),
);

// funcs
function genDaysKeys(d = null) {
  const firstDay = dayjs(new Date(`${props.year}-01-01 00:00:00`));
  const day =
    d ||
    (props.year === dayjs().year()
      ? dayjs().clone()
      : dayjs(`${props.year}-12-31`));
  const arr = [day.format('YYYY-MM-DD')];
  const next = day.add(-1, 'day');
  if (next < firstDay) {
    return arr;
  }
  return [...arr, ...genDaysKeys(next)];
}

async function getRecords() {
  loading.value = true;

  try {
    const targetTheme = AV.Object.createWithoutData('Theme', props.theme.id);
    const themeQuery = new AV.Query('Record');
    themeQuery.equalTo('theme', targetTheme);
    const dateQueryStart = new AV.Query('Record');
    dateQueryStart.greaterThanOrEqualTo(
      'date',
      new Date(`${props.year}-01-01 00:00:00`),
    );
    const dateQueryStop = new AV.Query('Record');
    dateQueryStop.lessThanOrEqualTo(
      'date',
      new Date(`${props.year}-12-31 23:59:59`),
    );
    (
      await AV.Query.and(themeQuery, dateQueryStart, dateQueryStop)
        .limit(366)
        .find()
    ).forEach((r) => {
      const dateKey = dayjs(r.attributes.date).format('YYYY-MM-DD');
      days[dateKey] = {
        value: r.attributes.value,
        comment: r.attributes.comment,
      };
    });
  } catch (err) {
    if (!err.message.includes("Class or object doesn't exists.")) {
      notify.error(store, err.message || 'Unknown Exception');
    }
  }

  loading.value = false;
}

function calcPadding() {
  padding.value =
    (theCardRef.value.$el.offsetWidth % (mdAndUp ? 16 : 13)) / 2 + 6.5;
}

function calcColor(value) {
  if (value) {
    const delta = value - props.theme.attributes.low;
    if (delta < unit.value) {
      return colors.value[0];
    }
    const targetIndex = Math.floor(delta / unit.value);
    return colors.value[targetIndex < 4 ? targetIndex : 3];
  }
  return undefined;
}

function calcSum(values) {
  return values.reduce((pre, curr) => pre + curr, 0);
}

function calcAverage(values) {
  return calcSum(values) / values.length;
}

function calcMinMax(values) {
  const valueSorted = values.sort((a, b) => a - b);
  return [valueSorted[0], valueSorted[values.length - 1]];
}

function calcIndexes(idxes, values) {
  const result = [];
  if (values.length) {
    idxes.forEach((idx) => {
      switch (idx) {
        case '总计':
          result.push({
            index: '总计',
            value: calcSum(values),
          });
          break;
        case '平均值':
          result.push({
            index: '平均',
            value: calcAverage(values),
          });
          break;
        case '最值':
          result.push(
            ...calcMinMax(values).map((m, i) => ({
              index: `最${i === 0 ? '小' : '大'}`,
              value: m,
            })),
          );
          break;
        default:
          break;
      }
    });
  }
  return result;
}

function checkDayBlank(day) {
  return JSON.stringify(day) === JSON.stringify({});
}

function showIndexes() {
  // year
  const indexesResult = calcIndexes(
    props.theme.attributes.indexes || [],
    Object.values(days)
      .filter((v) => !checkDayBlank(v))
      .map((v) => v.value),
  );

  if (indexesResult.length > 0) {
    indexes.result = indexesResult;

    if (props.year === new Date().getFullYear()) {
      // month
      const monthIndexesResult = calcIndexes(
        props.theme.attributes.indexes || [],
        Object.entries(days)
          .filter(
            ([k, v]) =>
              !checkDayBlank(v) &&
              new Date(k).getMonth() === new Date().getMonth(),
          )
          .map(([, v]) => v.value),
      );
      indexes.monthResult = monthIndexesResult;
    } else {
      indexes.monthResult = [];
    }
  } else {
    indexes.result = [];
    indexes.monthResult = [];
  }

  indexes.show = true;
}

watch(loading, (val) => {
  if (val) {
    nextTick(() => {
      loadingHeight.value = theCardRef.value.$el.clientHeight;
    });
  }
});

onMounted(() => {
  calcPadding();
  unit.value = (props.theme.attributes.high - props.theme.attributes.low) / 4;
  genDaysKeys().forEach((k) => {
    days[k] = {};
  });
  getRecords();
});
</script>
