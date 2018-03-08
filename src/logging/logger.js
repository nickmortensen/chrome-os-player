const bq = require('./bq-client');
const systemInfo = require('./system-info');

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
        height: viewerConfig.height
      };
    });
}

function readPlayerData() {
  return new Promise((resolve) => {
    chrome.storage.local.get((items) => resolve(items.playerData))
  });
}

function logClientInfo(viewerConfig, nowDate = new Date()) {
  return Promise.all([buildPlayerData(viewerConfig), readPlayerData()])
    .then((values) => {
      const [newData, savedData] = values;
      if (JSON.stringify(newData) === JSON.stringify(savedData)) {
        return savedData;
      }

      const data = Object.assign({ts: nowDate.toISOString()}, newData);
      return bq.insert(data, 'Player_Data', 'configuration')
          .then(() => chrome.storage.local.set({playerData: newData}));
    })
    .catch(console.error);
}

function log(event, details, nowDate = new Date()) {
  console.log(event, details);

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
      return bq.insert(data, 'ChromeOS_Player_Events', 'events');
    })
    .catch(console.error);
}

module.exports = {
  log,
  logClientInfo
}
