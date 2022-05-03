export const info = function infoNotification(store, content) {
  store.commit('SET_NOTIFICATION', { model: true, content, level: 'info' });
};

export const success = function successNotification(store, content) {
  store.commit('SET_NOTIFICATION', { model: true, content, level: 'success' });
};

export default {
  info,
  success,
};
