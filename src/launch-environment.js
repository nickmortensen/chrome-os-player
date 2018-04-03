let launchData = {};

module.exports = {
  set(env) {
    launchData = env;
  },
  isKioskSession() {return launchData.isKioskSession;},
  isDevelopmentVersion() {
    const manifest = chrome.runtime.getManifest();
    return manifest.version === '0.0.0.0';
  }
}
