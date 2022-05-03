import { createApp } from 'vue';
import AV from 'leancloud-storage';
import vuetify from './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store'

const app = createApp(App);

app.use(vuetify).use(router).use(store).mount('#app');
