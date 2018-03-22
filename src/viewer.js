const viewerInjector = require('./viewer-injector');
const viewerMessaging = require('./viewer-message-handler');
const contentLoader = require('./content-loader');
const logger = require('./logging/logger');
const messaging = require('./messaging/messaging-service-client');
const storage = require('./storage/storage');
const rebootScheduler = require('./reboot-scheduler');

function fetchContent(webview) {
  Promise.all([contentLoader.fetchContent(), viewerMessaging.viewerCanReceiveContent()]).then((values) => {
    logger.log('sending content to viewer');
    const [contentData] = values;
    webview.contentWindow.postMessage({from: 'player', topic: 'content-update', newContent: contentData}, webview.src);
    rebootScheduler.scheduleRebootFromViewerContents(contentData);
  });
}

function init() {
  window.addEventListener('message', (event) => {
    if (!event.data) {
      return;
    }

    event.preventDefault();

    console.log(`viewer window received message from webview: ${JSON.stringify(event.data)}`);
    viewerMessaging.handleMessage(event.data);
  });

  const webview = document.querySelector('webview');
  webview.addEventListener('contentload', () => {
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()});
    webview.contentWindow.postMessage({from: 'player', topic: 'hello'}, webview.src);
  });

  fetchContent(webview);

  messaging.init().then(() => storage.init());
  messaging.on('content-update', () => fetchContent(webview));
}

document.addEventListener("DOMContentLoaded", init);
