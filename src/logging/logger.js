const bq = require('./bq-client');
const systemInfo = require('./system-info');

function logClientInfo(viewerConfig, nowDate = new Date()) {
  return Promise.all([systemInfo.getMachineId(), systemInfo.getDisplayId(), systemInfo.getOS(), systemInfo.getIpAddress()])
    .then(values => {
      const [machineId, displayId, os, ip] = values;
      const playerData = {
        machine_id: machineId,
        display_id: displayId,
        os_description: os,
        player_name: systemInfo.getPlayerName(),
        player_version: systemInfo.getPlayerVersion(),
        browser_name: 'Chrome',
        browser_version: systemInfo.getChromeVersion(),
        local_ip: ip,
        viewer_version: viewerConfig.viewerVersion,
        width: viewerConfig.width,
        height: viewerConfig.height,
        ts: nowDate.toISOString()
      };

      return bq.insert(playerData, 'Player_Data', 'configuration');
    })
    .catch(console.error);
}

function log(event, details) {
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
        ts: new Date().toISOString()
      };
      return bq.insert(data, 'ChromeOS_Player_Events', 'events');
    })
    .catch(console.error);
}

module.exports = {
  log,
  logClientInfo
}
