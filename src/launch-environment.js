const logger = require("./logging/logger");

let launchData = {};

module.exports = {
  set(env) {
    const manifest = chrome.runtime.getManifest();
    launchData = env;
    logger.log(`Received launch data for ${manifest.version} via ${launchData.source}`);
  },
  isKioskSession() {return launchData.isKioskSession;}
}
