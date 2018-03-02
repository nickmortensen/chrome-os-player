const windowManager = require('./window-manager');
const logger = require('./logger');

function init(launchData) {
  logger.log(`launch from ${launchData.source}`, launchData);
  chrome.storage.local.get((items) => {
    if (items.displayId) {
      windowManager.launchViewer(items.displayId);
    } else {
      windowManager.launchPlayer();
    }
  });
}

chrome.app.runtime.onLaunched.addListener(init);

chrome.runtime.onRestartRequired.addListener(() => windowManager.closeAll());
