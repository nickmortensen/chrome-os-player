const viewerInjector = require('./viewer-injector');
const logger = require('./logging/logger');

function init() {
  window.addEventListener('message', (event) => {
    console.log(event);
    if (!event.data) {
      return;
    }

    event.preventDefault();
    const data = event.data;
    if (data.from === 'viewer') {
      console.log(`viewer window received message from webview: ${JSON.stringify(data)}`);
      if (data.message === 'viewer-config') {
        logger.logClientInfo(data);
      }
    }
  });

  const webview = document.querySelector('webview');
  webview.addEventListener('contentload', () => {
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()});
    webview.contentWindow.postMessage({from: 'player', topic: 'hello'}, webview.src);
  });
}

document.addEventListener("DOMContentLoaded", init);
