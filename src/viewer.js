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

function setUpMessaging() {
  const webview = document.querySelector('webview');
  viewerMessaging.init(webview);

  window.addEventListener('message', (event) => {
    if (!event.data) {
      return;
    }

    event.preventDefault();

    console.log(`viewer window received message from webview: ${JSON.stringify(event.data)}`);
    viewerMessaging.handleMessage(event.data);
  });

  webview.addEventListener('contentload', () => {
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()});
    viewerMessaging.sendMessage({from: 'player', topic: 'hello'});
  });
}

  fetchContent(webview);
function fetchContent() {
  Promise.all([contentLoader.fetchContent(), viewerMessaging.viewerCanReceiveContent()]).then((values) => {
    logger.log('sending content to viewer');
    const [contentData] = values;
    const regex = new RegExp('http://s3.amazonaws.com/widget-image/0.1.1/dist/widget.html', 'g');
    const rewriteUrl = 'http://widgets.risevision.com/image/widget.html';

    contentData.content.presentations.forEach((presentation) => presentation.layout = presentation.layout.replace(regex, rewriteUrl))

    viewerMessaging.sendMessage({from: 'player', topic: 'content-update', newContent: contentData});
  });

  messaging.init().then(() => storage.init());
  messaging.on('content-update', () => fetchContent(webview));
}

function init() {
  setUpMessaging();
  fetchContent();
}

document.addEventListener("DOMContentLoaded", init);
