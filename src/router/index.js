import { createRouter, createWebHashHistory } from 'vue-router';
import store from '../store';
import { getSigned, removeSigned } from '../utils/storage-util';
import { initAV } from '../utils/leancloud';

const routes = [
  {
    path: '/',
    component: () => import('@/views/Days.vue'),
  },
  {
    path: '/sign-in',
    component: () => import('@/views/SignIn.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  let signed = store.state.signedIn.appId;
  const signedStr = getSigned();

  if (!signed && signedStr) {
    store.commit('SET_LOADING', true);
    const signedLocal = JSON.parse(signedStr);
    const initResult = await initAV(signedLocal.appId, signedLocal.appKey);
    if (initResult) {
      signed = signedLocal.appId;
      store.commit('SET_SIGNED_IN', signedLocal);
    } else {
      removeSigned();
    }
    store.commit('SET_LOADING', false);
  }

  if (!signed) {
    if (to.path !== '/sign-in') {
      next({ path: '/sign-in', replace: true });
    } else {
      next();
    }
  } else if (to.path === '/sign-in') {
    next({ path: '/', replace: true });
  } else {
    next();
  }
});

export default router;
