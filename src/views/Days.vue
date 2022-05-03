<template>
  <v-container
    class="justify-center d-flex flex-wrap align-content-start"
    fluid
    style="min-height: 92vh"
  >
    <v-col
      cols="12"
      class="py-0 mb-1 d-flex align-center"
    >
      <v-menu
        v-model="avatarMenu"
      >
        <template #activator="{props}">
          <div
            style="cursor: pointer"
            v-bind="props"
          >
            <v-avatar
              ref="avatarRef"
              size="32"
              color="#B39DDB"
            />
            <v-icon size="small">
              mdi-menu-down
            </v-icon>
          </div>
        </template>
        <v-list
          density="compact"
          elevation="2"
          height="max-content"
          class="overflow-visible"
        >
          <v-list-item
            class="text-caption"
            @click="aboutDialog.model = true; avatarMenu = false"
          >
            关于
          </v-list-item>
          <v-list-item
            class="text-caption"
            color="error"
            @click="signOut"
          >
            Sign Out
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <div class="text-caption d-flex flex-wrap justify-end">
        <div>{{ dayInfo.date }}</div>
        <div
          class="text-h6 d-flex justify-end align-center"
          style="width: 100%; height: 26px"
        >
          {{ dayInfo.day }}
        </div>
      </div>
    </v-col>

    <!-- loading -->
    <v-col
      v-if="loading"
      cols="12"
    >
      <v-progress-linear
        indeterminate
        color="primary"
      />
    </v-col>

    <!-- themes -->
    <v-col
      v-for="item, index in themes"
      v-else
      :key="index"
      cols="12"
      lg="6"
      md="8"
    >
      <ThemeCard
        :key="themeKeys[item.attributes.name]"
        :theme="item"
        @reload-all="getThemes"
        @reload-current="refreshTheme"
      />
    </v-col>
  </v-container>

  <!-- footer -->
  <v-footer
    color="transparent"
    class="text-caption d-flex align-center justify-center"
    style="height: 8vh"
  >
    逝者如斯夫，不舍昼夜。
  </v-footer>

  <!-- create menu -->
  <v-menu
    v-model="plusMenu"
    anchor="start top"
  >
    <template #activator="{props}">
      <v-btn
        v-bind="props"
        icon="mdi-plus"
        class="create-new-button ma-7"
      />
    </template>
    <v-list
      density="compact"
      elevation="2"
      class="overflow-visible"
      width="max-content"
      style="position: absolute; bottom: 0"
    >
      <v-list-item
        class="text-caption"
        @click="recordDialog.model = true; plusMenu = false; avatarMenu = false;"
      >
        记录本日
      </v-list-item>
      <v-list-item
        class="text-caption"
        @click="createDialog.model = true; plusMenu = false; avatarMenu = false;"
      >
        新主题
      </v-list-item>
    </v-list>
  </v-menu>

  <!-- dialogs -->
  <create-theme-dialog
    :key="createDialog.key"
    v-model="createDialog.model"
    @reload="getThemes"
  />
  <record-day-dialog
    :key="recordDialog.key"
    v-model="recordDialog.model"
    :themes="themes.map(t=>t.attributes.name)"
    @reload="reloadTheme"
  />
  <app-about-dialog
    :key="aboutDialog.key"
    v-model="aboutDialog.model"
  />
</template>
<script setup>
import ThemeCard from '@/components/ThemeCard.vue';
import CreateThemeDialog from '@/components/CreateThemeDialog.vue';
import RecordDayDialog from '@/components/RecordDayDialog.vue';
import AppAboutDialog from '@/components/AboutDialog.vue';
import {
  reactive, ref, watch, onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AV from 'leancloud-storage';
import multiavatar from '@multiavatar/multiavatar';
import { removeSigned } from '../utils/storage-util';

const dayOfWeekMap = {
  Mon: '星期一',
  Tue: '星期二',
  Wed: '星期三',
  Thu: '星期四',
  Fri: '星期五',
  Sat: '星期六',
  Sun: '星期日',
};

const router = useRouter();
const store = useStore();
const avatarMenu = ref(false);
const plusMenu = ref(false);
const loading = ref(false);
const avatarRef = ref(null);
const themes = ref([]);
const dayInfo = reactive({
  date: '',
  day: '',
});
const themeKeys = reactive({});
const createDialog = reactive({
  model: false,
  key: new Date().getTime(),
});
const recordDialog = reactive({
  model: false,
  key: new Date().getTime(),
});
const aboutDialog = reactive({
  model: false,
  key: new Date().getTime(),
});

function signOut() {
  store.commit('SET_LOADING', true);
  store.dispatch('resetSignedIn');
  removeSigned();
  avatarMenu.value = false;
  setTimeout(() => {
    store.commit('SET_LOADING', false);
  }, 800);
  router.push('/sign-in');
}

async function getThemes() {
  loading.value = true;
  const query = new AV.Query('Theme');
  themes.value = await query.find();
  themes.value.forEach((t) => {
    themeKeys[t.attributes.name] = new Date().getTime();
  });
  loading.value = false;
}

function reloadTheme(theme) {
  themeKeys[theme] = new Date().getTime();
}

async function refreshTheme(themeId) {
  const query = new AV.Query('Theme');
  const newest = await query.get(themeId);
  const theTheme = themes.value.find((t) => t.id === themeId);
  Object.assign(theTheme, newest);
  reloadTheme(theTheme.attributes.name);
}

watch(() => createDialog.model, (val) => {
  if (!val) {
    setTimeout(() => {
      createDialog.key = new Date().getTime();
    }, 800);
  }
});

watch(() => recordDialog.model, (val) => {
  if (!val) {
    setTimeout(() => {
      recordDialog.key = new Date().getTime();
    }, 800);
  }
});

watch(() => aboutDialog.model, (val) => {
  if (!val) {
    setTimeout(() => {
      aboutDialog.key = new Date().getTime();
    }, 800);
  }
});

onMounted(() => {
  // themes
  getThemes();

  // avatar
  const avatar = multiavatar(store.state.signedIn.appId);
  avatarRef.value.$el.innerHTML = avatar;

  // day info
  const [dayOfWeek, month, day, year] = new Date().toString().split(' ').slice(0, 4);
  dayInfo.date = `${day} ${month}, ${year}`;
  dayInfo.day = dayOfWeekMap[dayOfWeek];
});
</script>
<style scoped>
.create-new-button{
  position: fixed;
  right: 0;
  bottom: 0;
}
.v-btn.active{
  border: thin solid #B39DDB;
  color: #B39DDB !important;
}
</style>
