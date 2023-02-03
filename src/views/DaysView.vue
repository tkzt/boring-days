<template>
  <v-container
    class="justify-center d-flex flex-wrap align-content-stretch"
    fluid
    style="min-height: 89vh"
  >
    <v-col
      cols="12"
      md="7"
      lg="5"
      xl="4"
      class="px-0"
    >
      <v-col
        cols="12"
        class="pt-0"
      >
        <v-card
          flat
          class="d-flex align-center pa-3"
          rounded="lg"
          :loading="loading"
        >
          <!-- loader -->
          <template #loader="{ isActive }">
            <v-progress-linear
              :active="isActive"
              color="primary"
              indeterminate
              height="2"
            />
          </template>

          <!-- avatar -->
          <v-menu
            v-model="avatarMenu"
          >
            <template #activator="{props}">
              <div
                style="cursor: pointer"
                v-bind="props"
                class="flex-shrink-0"
              >
                <v-avatar
                  ref="avatarRef"
                  size="36"
                  color="primary"
                />
              </div>
            </template>
            <v-list
              density="compact"
            >
              <v-list-item
                class="text-caption"
                @click="aboutDialog.model = true; avatarMenu = false"
              >
                关于
              </v-list-item>
              <v-list-item
                class="text-caption text-error"
                @click="signOut"
              >
                Sign Out
              </v-list-item>
            </v-list>
          </v-menu>

          <v-spacer />

          <!-- years -->
          <v-tabs
            v-model="currYear"
            color="primary"
            density="compact"
            align-tabs="center"
            height="28"
          >
            <v-tab
              v-for="year, index in years"
              :key="index"
              :value="year"
            >
              {{ year }}
            </v-tab>
          </v-tabs>

          <v-spacer />

          <!-- create new -->
          <v-menu
            v-model="plusMenu"
          >
            <template #activator="{props}">
              <v-btn
                v-bind="props"
                size="36"
                color="primary"
                icon="mdi-plus"
              />
            </template>
            <v-list
              density="compact"
            >
              <v-list-item
                class="text-caption"
                @click="recordDialog.model = true;"
              >
                新记录
              </v-list-item>
              <v-list-item
                class="text-caption"
                @click="createDialog.model = true;"
              >
                新主题
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card>
      </v-col>

      <!-- themes -->
      <template v-if="themes?.length">
        <v-col
          v-for="item, index in themes"
          :key="index"
          cols="12"
        >
          <ThemeCard
            :key="themeKeys[item.attributes.name]"
            :theme="item"
            :year="currYear"
            @reload-all="getThemes"
            @reload-current="refreshTheme"
            @edit-day="day=>{
              Object.assign(editingDay, {...day, theme: item.attributes.name});
              recordDialog.model = true;
            }"
          />
        </v-col>
      </template>
      <v-col
        v-else-if="!loading"
      >
        <v-card
          flat
          class="pa-2 text-caption d-flex align-center"
        >
          🎨 从
          <v-btn
            size="small"
            variant="plain"
            flat
            color="primary"
            class="pa-0"
            @click="createDialog.model = true;"
          >
            创建一个主题
          </v-btn>
          开始吧～
        </v-card>
      </v-col>
    </v-col>
  </v-container>

  <!-- footer -->
  <v-container
    fluid
    class="d-flex py-0 justify-center"
  >
    <v-col
      cols="12"
      md="7"
      lg="5"
      xl="4"
      class="text-caption text-grey d-flex flex-wrap py-0"
      style="position: relative"
    >
      <v-col
        cols="12"
        class="pa-0"
      >
        -
      </v-col>
      <v-col
        cols="12"
        class="d-flex align-center pa-0"
      >
        <div>
          <p> 逝者如斯夫，不舍昼夜。</p>
          <p>&copy; {{ new Date().getFullYear() }} Allen Tao.</p>
        </div>
        <v-spacer />
        <v-btn
          :icon="theme.global.current.value.dark?'mdi-weather-night':'mdi-weather-sunny'"
          size="small"
          elevation="0"
          @click="toggleColorTheme"
        />
      </v-col>
    </v-col>
  </v-container>

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
    :editing="editingDay"
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
import { useTheme } from 'vuetify';
import { removeSigned } from '../utils/storage-util';

const years = new Array(new Date().getFullYear() - 2022 + 1)
  .fill().map((_, index) => index + 2022); // Boring Days was created in 2022

const router = useRouter();
const store = useStore();
const theme = useTheme();
const avatarMenu = ref(false);
const plusMenu = ref(false);
const loading = ref(false);
const avatarRef = ref(null);
const themes = ref([]);
const currYear = ref(new Date().getFullYear());
const editingDay = ref({});
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

async function signOut() {
  store.commit('SET_LOADING', true);
  await store.dispatch('resetSignedIn');
  removeSigned();
  setTimeout(() => {
    store.commit('SET_LOADING', false);

    // reload to reset AV
    window.location.reload();
  }, 800);
  router.push('/sign-in');
}

async function getThemes() {
  loading.value = true;
  try {
    const query = new AV.Query('Theme');
    themes.value = await query.find();
    themes.value.forEach((t) => {
      themeKeys[t.attributes.name] = new Date().getTime();
    });
  } catch {
    // initially, theme Object doesn't exist
  }

  loading.value = false;
}

function reloadTheme(targetTheme) {
  themeKeys[targetTheme] = new Date().getTime();
}

async function refreshTheme(themeId) {
  const query = new AV.Query('Theme');
  const newest = await query.get(themeId);
  const theTheme = themes.value.find((t) => t.id === themeId);
  Object.assign(theTheme, newest);
  reloadTheme(theTheme.attributes.name);
}

function toggleColorTheme() {
  const newTheme = theme.global.current.value.dark ? 'light' : 'dark';
  theme.global.name.value = newTheme;

  // cache
  localStorage.setItem('colorTheme', newTheme);
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
      editingDay.value = {};
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

watch(currYear, () => {
  getThemes();
});

onMounted(() => {
  // themes
  getThemes();

  // avatar
  const avatar = multiavatar(store.state.signedIn.appId);
  avatarRef.value.$el.innerHTML = avatar;
});
</script>
