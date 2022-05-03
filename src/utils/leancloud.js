import AV from 'leancloud-storage';

export const createRecord = (table, columns) => {
  const row = new (AV.Object.extend(table))();
  Object.keys(columns).forEach((k) => {
    row.set(k, columns[k]);
  });
  return row.save();
};

export const getRecords = (table, begin, end) => {
  const query = new AV.Query(table);
  query.greaterThanOrEqualTo(begin);
  query.lessThanOrEqualTo(end);
  return query.find();
};

export const initAV = (appId, appKey) => {
  if (!AV.applicationId) {
    try {
      AV.init({ appId, appKey });
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(!!AV.applicationId);
        }, 2000);
      });
    } catch (err) {
      return new Promise((resolve) => { resolve(err); });
    }
  }

  return new Promise((resolve) => { resolve(true); });
};
