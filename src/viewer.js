const viewerInjector = require('./viewer-injector');
const viewerMessaging = require('./messaging/viewer-messaging');
const contentLoader = require('./content-loader');
const logger = require('./logging/logger');
const messaging = require('./messaging/messaging-service-client');
const storage = require('./storage/storage');
const licensing = require('./licensing/licensing');
const rebootScheduler = require('./reboot-scheduler');
const fileServer = require('./storage/file-server');

function setUpMessaging() {
  const webview = document.querySelector('webview');
  viewerMessaging.init(webview);

  webview.addEventListener('loadstart', (evt) => {
    if (!evt.isTopLevel) {return;}
    if (!evt.url.match(/http[s]?:\/\/viewer(?:-test)?.risevision.com/)) {return;}
    webview.executeScript({code: viewerInjector.generateMessagingSetupFunction()}, ()=>{
      viewerMessaging.send({from: 'player', topic: 'latch-app-window'});
    });
  });

  messaging.on('content-update', fetchContent);
  messaging.on('reboot-request', () => rebootScheduler.rebootNow());
  viewerMessaging.on('viewer-config', logger.logClientInfo);

  return messaging.init();
}

function fetchContent() {
  Promise.all([contentLoader.fetchContent(), viewerMessaging.viewerCanReceiveContent()]).then((values) => {
    if (!values || values === {}) {
      logger.error('empty content response');
      return;
    }
    const [contentData] = values;
    logger.log('sending content to viewer', contentData);
    viewerMessaging.send({from: 'player', topic: 'content-update', newContent: contentData});
    rebootScheduler.scheduleRebootFromViewerContents(contentData);
  })
  .catch((error) => logger.error('error when fetching content', error));
}

function init() {
  setUpMessaging().then(() => {
    storage.init();
    licensing.init();
  });
  fileServer.init();
  fetchContent();
}

document.addEventListener('DOMContentLoaded', init);
