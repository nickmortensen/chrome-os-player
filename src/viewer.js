const viewerInjector = require('./viewer-injector');
const viewerMessaging = require('./viewer-message-handler');
const contentLoader = require('./content-loader');
const logger = require('./logging/logger');
const messaging = require('./messaging/messaging-service-client');
const storage = require('./storage/storage');
const rebootScheduler = require('./reboot-scheduler');

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

  webview.addEventListener('loadstart', (evt) => {
    if (!evt.isTopLevel) {return;}
    if (!evt.url.match(/http[s]?:\/\/viewer(?:-test)?.risevision.com/)) {return;}
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()}, ()=>{
      viewerMessaging.sendMessage({from: "player", topic: "latch-app-window"});
    });
  });

  messaging.on('content-update', fetchContent);

  return messaging.init();
}

function fetchContent() {
  Promise.all([contentLoader.fetchContent(), viewerMessaging.viewerCanReceiveContent()]).then((values) => {
    logger.log('sending content to viewer');
    const [contentData] = values;
    viewerMessaging.sendMessage({from: 'player', topic: 'content-update', newContent: contentData});
    rebootScheduler.scheduleRebootFromViewerContents(contentData);
  });
}

function init() {
  setUpMessaging().then(storage.init);
  fetchContent();
}

document.addEventListener("DOMContentLoaded", init);
