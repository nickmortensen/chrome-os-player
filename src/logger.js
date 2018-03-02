const bq = require('./bq-client');
const systemInfo = require('./system-info');

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
      return bq.insert(data);
    })
    .catch(console.error);
}

module.exports = {
  log
}
