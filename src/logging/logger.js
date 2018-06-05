const isEqual = require('lodash.isequal');
const bq = require('./bq-retry');
const systemInfo = require('./system-info');
const environment = require('../launch-environment');
const moment = require('moment-timezone');

function buildPlayerData(viewerConfig) {
  return Promise.all([systemInfo.getMachineId(), systemInfo.getDisplayId(), systemInfo.getOS(), systemInfo.getIpAddress()])
    .then(values => {
      const [machineId, displayId, os, ip] = values;
      const chromeOSVersion = systemInfo.getChromeOSVersion();
      return {
        machine_id: machineId,
        display_id: displayId,
        os_description: chromeOSVersion ? `Chrome OS ${chromeOSVersion}` : os,
        player_name: systemInfo.getPlayerName(),
        player_version: systemInfo.getPlayerVersion({includeBetaPrefix: false}),
        browser_name: 'Chrome',
        browser_version: systemInfo.getChromeVersion(),
        local_ip: ip,
        viewer_version: viewerConfig.viewerVersion,
        width: viewerConfig.width,
        height: viewerConfig.height,
        time_zone: moment.tz.guess(),
        utc_offset: moment().format("Z")
      };
    });
}

function readPlayerData() {
  return new Promise((resolve) => {
    chrome.storage.local.get((items) => resolve(items.playerData))
  });
}

function logClientInfo(viewerConfig, nowDate = new Date()) {
  if (environment.isDevelopmentVersion()) {return Promise.resolve();}

  return Promise.all([buildPlayerData(viewerConfig), readPlayerData()])
    .then((values) => {
      const [newData, savedData] = values;
      if (isEqual(newData, savedData)) {
        return savedData;
      }

      const data = Object.assign({ts: nowDate.toISOString()}, newData);
      return bq.insert(data, 'Player_Data', 'configuration', nowDate)
          .then(() => chrome.storage.local.set({playerData: newData}));
    })
    .catch(console.error);
}

/**
 * @param {string} event
 * @param {object} [details]
 * @param {Date} [nowDate]
 * @returns {Promise}
 */
function log(event, details, nowDate = new Date()) {
  console.log(event, details);

  if (environment.isDevelopmentVersion()) {return Promise.resolve();}

  return Promise.all([systemInfo.getId(), systemInfo.getOS(), systemInfo.getIpAddress()])
    .then(values => {
      const [id, os, ip] = values;
      const data = {
        event,
        id,
        os,
        ip,
        player_version: systemInfo.getPlayerVersion(),
        event_details: JSON.stringify(details),
        chrome_version: systemInfo.getChromeVersion(),
        ts: nowDate.toISOString()
      };
      return bq.insert(data, 'ChromeOS_Player_Events', 'events', nowDate);
    })
    .catch(console.error);
}

/**
 * @param {string} event
 * @param {Error} [err]
 * @param {Date} [nowDate]
 * @returns {Promise}
 */
function error(event, err, nowDate = new Date()) {
  console.error(event, err);

  const details = {};
  if (err) {
    details.message = err.message;
    details.stack = err.stack;
  }
  return log(event, details, nowDate);
}

module.exports = {
  log,
  logClientInfo,
  error
}
