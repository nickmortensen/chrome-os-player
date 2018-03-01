const bq = require('./bq-client');

function bufferToHex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), value => value.toString(16).padStart(2, '0')).join(''); // eslint-disable-line
}

function generateMachineId() {
  return crypto.subtle.digest('SHA-1', Uint8Array.of(Date.now()))
    .then(value => bufferToHex(value));
}

function readLocalStorage() {
  return new Promise((resolve) => chrome.storage.local.get(items => resolve(items)));
}

function getMachineId() {
  return readLocalStorage()
    .then(items => {
      if (items.machineId) {
        return items.machineId;
      }

      return generateMachineId().then((machineId) => {
        chrome.storage.local.set({machineId})
        return machineId;
      });
    });
}

function getDisplayId() {
  return readLocalStorage().then(items => items.displayId);
}

function getIdValue() {
  return getDisplayId().then(displayId => {
    if (displayId) {
      return displayId;
    }

    return getMachineId().then(machineId => `0.${machineId}`);
  });
}

function getPlayerVersion() {
  const manifest = chrome.runtime.getManifest();
  if (manifest.name.includes('Beta')) {
    return `beta_${manifest.version}`;
  }
  return manifest.version;
}

function getIpAddress() {
  return new Promise((resolve) => {
    chrome.system.network.getNetworkInterfaces((interfaces) => {
      resolve(interfaces.map(it => it.address).join(','));
    });
  });
}

function getOS() {
  return new Promise((resolve) => {
    chrome.runtime.getPlatformInfo((platformInfo) => {
      resolve(`${platformInfo.os}/${platformInfo.arch}`);
    });
  });
}

function log(event, details) {
  console.log(event, details);

  return Promise.all([getIdValue(), getOS(), getIpAddress()])
    .then(values => {
      console.log('asdfsad')
      const [id, os, ip] = values;
      const data = {
        event,
        id,
        os,
        ip,
        player_version: getPlayerVersion(),
        event_details: JSON.stringify(details),
        chrome_version: (/Chrome\/([0-9.]+)/).exec(navigator.appVersion)[1],
        ts: new Date().toISOString()
      };
      return bq.insert(data);
    });
}

module.exports = {
  log
}
