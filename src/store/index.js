import { createStore } from 'vuex';

const mutations = {
  SET_SIGNED_IN: (state, payload) => {
    state.signedIn = payload;
  },
  SET_LOADING: (state, payload) => {
    state.loading = payload;
  },
  SET_NOTIFICATION: (state, payload) => {
    state.notification = payload;
  },
};

const actions = {
  resetSignedIn: ({ commit }) => {
    commit('SET_SIGNED_IN', {
      appId: '',
      appKey: '',
    });
  },
};

const store = createStore({
  state: {
    signedIn: {
      appId: '',
      appKey: '',
    },
    loading: false,
    notification: {
      model: false,
      content: '',
      level: '',
    },
  },
  mutations,
  actions,
});

export default store;
