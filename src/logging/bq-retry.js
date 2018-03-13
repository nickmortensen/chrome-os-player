const bq = require('./bq-client');

const RETRY_ALARM = 'bq-retry';
const MAX_FAILED_LOG_QUEUE = 50;
const FIVE_HOURS_IN_MINUTES = 300;

let delayInMinutes = 10;

/**
 * Inserts an entry on BigQuery persisting it in case of failure. Failed inserts are retried after 10 minutes initially up to 5 hours with the maximum of 50 entries pending.
 * @param {object} data
 * @param {string} dataset
 * @param {string} table
 */
function insert(data, dataset, table, nowDate = new Date()) {
  return bq.insert(data, dataset, table)
    .catch((error) => {
      console.error(error);
      return saveFailedLogEntry(dataset, table, {data, ts: Number(nowDate)}).then(() => scheduleRetry());
    });
}

function readFailedLogEntries() {
  return new Promise((resolve) => {
    chrome.storage.local.get((items) => resolve(items.failedLogEntries || {}));
  });
}

function saveFailedLogEntries(failedLogEntries) {
  return new Promise((resolve) => {
    chrome.storage.local.set({failedLogEntries}, () => resolve(failedLogEntries));
  });
}

function saveFailedLogEntry(dataset, table, entry) {
  return readFailedLogEntries()
    .then(failedLogEntries => {
      const key = `${dataset}/${table}`;
      const entries = failedLogEntries[key] || [];
      entries.push(entry);
      failedLogEntries[key] = entries.sort((one, other) => one.ts - other.ts);
      const excess = failedLogEntries[key].length - MAX_FAILED_LOG_QUEUE;
      if (excess > 0) {
        failedLogEntries[key] = failedLogEntries[key].slice(excess);
      }
      return failedLogEntries;
    })
    .then(entries => saveFailedLogEntries(entries));
}

function scheduleRetry() {
  chrome.alarms.create(RETRY_ALARM, {delayInMinutes})
  delayInMinutes = Math.min(delayInMinutes * 1.5, FIVE_HOURS_IN_MINUTES); // eslint-disable-line no-magic-numbers
}

function insertFailedLogEntries() {
  return readFailedLogEntries()
    .then(failedLogEntries => {

      function reducer(promiseChain, key) {
        return promiseChain.then(() => {
          const entries = failedLogEntries[key].map(it => it.data);
          const [dataset, table] = key.split('/');
          return bq.insertMultiple(entries, dataset, table)
            .then(() => Reflect.deleteProperty(failedLogEntries, key));
        });
      }

      return Object.keys(failedLogEntries).reduce(reducer, Promise.resolve())
        .then(() => saveFailedLogEntries(failedLogEntries))
        .catch(() => scheduleRetry());
    });
}

function setupAlarmListener() {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === RETRY_ALARM) {
      insertFailedLogEntries();
    }
  });
}

setupAlarmListener();

module.exports = {
  insertFailedLogEntries,
  insert
}
