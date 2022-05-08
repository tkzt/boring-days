<template>
  <v-card
    ref="theCard"
    color="white"
    class="d-flex flex-wrap overflow-visible"
    style="position: relative"
    :style="{padding: padding+'px'}"
    flat
  >
    <div
      class="d-flex mb-2 px-1 text-caption align-center"
      style="width: 100%; height: 12px"
    >
      <span
        style="font-weight: bold; position: relative"
        class="theme-name"
        @click="showIndexes"
      >
        {{ theme?theme.attributes.name:'' }}
        <v-card
          v-if="indexes.show"
          flat
          color="rgba(0, 0, 0, .87)"
          class="indexes text-caption"
        >
          <div class="indexes-content">
            <div
              v-for="i,idx in indexes.result"
              :key="idx"
            >
              <template v-if="typeof i === 'object'">
                {{ i.index }}: {{ i.value.toFixed(2) }}
              </template>
              <template v-else>{{ i }}</template>
            </div>
          </div>
          <div class="tail" />
        </v-card>
      </span>
      <v-spacer />
      <v-menu
        v-model="rightClickMenu"
        anchor="start top"
      >
        <template #activator="{props: p}">
          <v-icon
            v-bind="p"
            style="cursor: pointer"
          >
            mdi-dots-horizontal
          </v-icon>
        </template>
        <v-list
          density="compact"
          elevation="1"
        >
          <v-list-item
            class="text-caption"
            @click="editDialog = true; rightClickMenu = false"
          >
            编辑
          </v-list-item>
          <v-list-item
            class="text-caption"
            color="error"
            @click="deleteDialog = true; rightClickMenu = false"
          >
            删除
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <template
      v-for="[key, value], idx in Object.entries(days).sort(([k1], [k2])=>k1>k2?1:-1)"
      :key="idx"
    >
      <day-card
        v-if="value"
        :date="key"
        :value="value.value"
        :comment="value.comment"
        :color="calcColor(value.value)"
        :comment-show="comment===idx"
        @click="comment = idx"
      />
      <day-card
        v-else
        :date="key"
        :comment-show="comment===idx"
        @click="comment = idx"
      />
    </template>
    <v-card
      v-if="loading"
      flat
      absolute
      top="0"
      left="0"
      style="opacity: .62"
      width="100%"
      :height="loadingHeight"
      class="d-flex align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="small"
        width="2"
      />
    </v-card>
  </v-card>
  <delete-confirm-dialog
    v-model="deleteDialog"
    :theme="theme"
    @reload="emit('reloadAll')"
  />
  <edit-theme-dialog
    v-model="editDialog"
    :theme="theme"
    @reload="emit('reloadCurrent', theme.id)"
  />
</template>
<script setup>
import {
  onBeforeUnmount, onMounted, ref, computed, reactive, watch, nextTick,
} from 'vue';
import colorsJson from '@/assets/colors.json';
import Dayjs from 'dayjs';
import AV from 'leancloud-storage';
import DayCard from './DayCard.vue';
import DeleteConfirmDialog from './DeleteConfirmDialog.vue';
import EditThemeDialog from './EditThemeDialog.vue';

// props & emit
const props = defineProps({
  theme: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['reloadAll', 'reloadCurrent']);

// reactive
const theCard = ref(null);
const padding = ref(0);
const comment = ref(-1);
const unit = ref(0);
const loading = ref(false);
const loadingHeight = ref(0);
const deleteDialog = ref(false);
const editDialog = ref(false);
const rightClickMenu = ref(false);
const indexes = reactive({ show: false, result: [] });
const days = reactive({});

const colors = computed(
  () => props.theme && colorsJson.find((c) => c.value === props.theme.attributes.color).colors,
);

// funcs
function onClickOutside(ev) {
  const { target } = ev;
  if (target) {
    if (!theCard.value.$el.contains(target) || (!target.classList.contains('day') && !target.classList.contains('theme-name'))) {
      comment.value = -1;
      indexes.show = false;
      rightClickMenu.value = false;
    }
  }
}

function genDaysKeys(d = null) {
  const firstDay = new Dayjs(new Date(`${new Date().getFullYear()}-01-01 00:00:00`));
  const day = d || new Dayjs().clone();
  const arr = [day.format('YYYY-MM-DD')];
  const next = day.add(-1, 'day');
  if (next < firstDay) {
    return arr;
  }
  return [...arr, ...genDaysKeys(next)];
}

async function getRecords() {
  loading.value = true;
  const theme = AV.Object.createWithoutData('Theme', props.theme.id);
  const themeQuery = new AV.Query('Record');
  themeQuery.equalTo('theme', theme);
  const dateQueryStart = new AV.Query('Record');
  dateQueryStart.greaterThanOrEqualTo('lastModifiedAt', new Date(`${new Date().getFullYear()}-01-01 00:00:00`));
  const dateQueryStop = new AV.Query('Record');
  dateQueryStop.lessThanOrEqualTo('lastModifiedAt', new Date(`${new Date().getFullYear()}-12-31 23:59:59`));

  (await AV.Query.and(themeQuery, dateQueryStart, dateQueryStop).limit(366).find()).forEach((r) => {
    const dateKey = new Dayjs(r.attributes.lastModifiedAt).format('YYYY-MM-DD');
    days[dateKey] = {
      value: r.attributes.value,
      comment: r.attributes.comment,
    };
  });
  loading.value = false;
}

function calcPadding() {
  padding.value = (theCard.value.$el.offsetWidth % 13) / 2 + 6.5;
}

function calcColor(value) {
  const delta = value - props.theme.attributes.low;
  if (delta < unit.value) {
    return colors.value[0];
  }
  const targetIndex = Math.floor(delta / unit.value);
  return colors.value[targetIndex < 4 ? targetIndex : 3];
}

function calcSum(values) {
  return values.reduce((pre, curr) => pre + curr, 0);
}

function calcAverage(values) {
  const aver = calcSum(values) / values.length;
  return (aver % 1 === 0) ? aver : aver.toFixed(2);
}

function calcMinMax(values) {
  const valueSorted = values.sort((a, b) => a - b);
  return [valueSorted[0], valueSorted[values.length - 1]];
}

function calcIndexes(idxes) {
  const values = Object.values(days).filter((v) => !!v).map((v) => v.value);
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
          result.push(...calcMinMax(values).map((m, i) => ({
            index: `最${i === 0 ? '小' : '大'}`,
            value: m,
          })));
          break;
        default: break;
      }
    });
  }
  return result;
}

function showIndexes() {
  const indexesResult = calcIndexes(props.theme.attributes.indexes || []);
  indexes.show = true;
  if (indexesResult.length > 0) {
    indexes.result = indexesResult;
  } else {
    indexes.result = ['无统计指标~'];
  }
}

// life circle
watch(loading, (val) => {
  if (val) {
    nextTick(() => {
      loadingHeight.value = theCard.value.$el.clientHeight;
    });
  }
});

onMounted(() => {
  calcPadding();
  unit.value = (props.theme.attributes.high - props.theme.attributes.low) / 4;
  genDaysKeys().forEach((k) => { days[k] = null; });
  getRecords();

  window.addEventListener('resize', calcPadding);
  window.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcPadding);
  window.removeEventListener('click', onClickOutside);
});
</script>
<style scoped>
.indexes{
  position: absolute;
  left: calc(100% + 3px);
  top: 0;
  color: white;
  z-index: 2;
  overflow: visible;
}

.indexes-content {
  width: max-content;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 160px;
  max-height: 125px;
  padding: 4px 8px;
  user-select: none;
  line-height: 12px;
  overflow-y: auto;
}

.tail {
  width: 0;
  height: 0;
  border: 3px solid transparent;
  border-right-color: rgba(0, 0, 0, .87);
  border-left: 0;
  position: absolute;
  left: -3px;
  top: 5px;
}

.theme-name {
  cursor: pointer;
}
</style>
