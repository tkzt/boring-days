const info = function infoNotification(store, content) {
  store.commit('SET_NOTIFICATION', { model: true, content, level: 'info' });
};

const success = function successNotification(store, content) {
  store.commit('SET_NOTIFICATION', { model: true, content, level: 'success' });
};

const error = function successNotification(store, content) {
  store.commit('SET_NOTIFICATION', { model: true, content, level: 'error' });
};

export default {
  info,
  success,
  error,
};
