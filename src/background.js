const windowManager = require('./window-manager');

function init(launchData) {
  console.log(`Player launched with ${JSON.stringify(launchData)}`);
  windowManager.launchPlayer();
}

chrome.app.runtime.onLaunched.addListener(init);
