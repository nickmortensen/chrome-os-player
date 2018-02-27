const windowManager = require('./window-manager');

function init(launchData) {
  console.log(`Player launched with ${JSON.stringify(launchData)}`);
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
