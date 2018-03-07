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

function getId() {
  return getDisplayId().then(displayId => {
    if (displayId) {
      return displayId;
    }

    return getMachineId().then(machineId => `0.${machineId}`);
  });
}

function getPlayerVersion(options = {includeBetaPrefix: true}) {
  const manifest = chrome.runtime.getManifest();
  if (options.includeBetaPrefix && manifest.name.includes('Beta')) {
    return `beta_${manifest.version}`;
  }
  return manifest.version;
}

function getPlayerName() {
  const playerName = 'RisePlayer';
  const manifest = chrome.runtime.getManifest();
  if (manifest.name.includes('Beta')) {
    return `(Beta) ${playerName}`;
  }
  return playerName;
}

function getIpAddress() {
  return new Promise((resolve) => {
    chrome.system.network.getNetworkInterfaces((interfaces) => {
      const v4Ips = interfaces.filter(it => it.address.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/));
      if (v4Ips.length > 0) {
        resolve(v4Ips[0].address);
      } else {
        resolve('');
      }
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

function getChromeVersion() {
  return (/Chrome\/([0-9.]+)/).exec(navigator.appVersion)[1];
}

function getChromeOSVersion() {
  const matches = (/CrOS.+\s((?:\d+\S)+\d+)\)/).exec(navigator.appVersion);
  if (matches && matches.length > 0) {
    return matches[1];
  }
  return '';
}

module.exports = {
  getMachineId,
  getDisplayId,
  getId,
  getOS,
  getIpAddress,
  getPlayerVersion,
  getPlayerName,
  getChromeVersion,
  getChromeOSVersion
}
