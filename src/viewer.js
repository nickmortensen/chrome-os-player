const viewerInjector = require('./viewer-injector');
const viewerMessaging = require('./viewer-message-handler');

function init() {
  const webview = document.querySelector('webview');
  viewerMessaging.init(webview);

  window.addEventListener('message', (event) => {
    console.log(event);
    if (!event.data) {
      return;
    }

    event.preventDefault();

    console.log(`viewer window received message from webview: ${JSON.stringify(event.data)}`);
    viewerMessaging.handleMessage(event.data);
  });

  webview.addEventListener('contentload', () => {
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()});
    webview.contentWindow.postMessage({from: 'player', topic: 'hello'}, webview.src);
  });
}

document.addEventListener("DOMContentLoaded", init);
