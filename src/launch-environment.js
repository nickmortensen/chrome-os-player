let launchData = {};

module.exports = {
  init() {
    return new Promise((res) => chrome.storage.local.get('launchData', storedData => {
      launchData = storedData.launchData;
      res();
    }));
  },
  set(env) {
    launchData = env;
    chrome.storage.local.set({launchData});
  },
  isKioskSession() {return launchData.isKioskSession;},
  isDevelopmentVersion() {
    const manifest = chrome.runtime.getManifest();
    return manifest.version === '0.0.0.0';
  },
  getLaunchData() {return launchData;}
}
