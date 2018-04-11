const viewerInjector = require('./viewer-injector');
const viewerMessaging = require('./messaging/viewer-messaging');
const contentLoader = require('./content-loader');
const logger = require('./logging/logger');
const messaging = require('./messaging/messaging-service-client');
const storage = require('./storage/storage');
const rebootScheduler = require('./reboot-scheduler');
const fileServer = require('./storage/file-server');
const util = require('./util');
const pixelmatch = require('pixelmatch');

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
  viewerMessaging.on('viewer-config', logger.logClientInfo);

  return messaging.init();
}

function fetchContent() {
  Promise.all([contentLoader.fetchContent(), viewerMessaging.viewerCanReceiveContent()]).then((values) => {
    if (!values || values === {}) {
      logger.error('empty content response');
      return;
    }
    logger.log('sending content to viewer');
    const [contentData] = values;
    viewerMessaging.send({from: 'player', topic: 'content-update', newContent: contentData});
    rebootScheduler.scheduleRebootFromViewerContents(contentData);
  })
  .catch((error) => logger.error('error when fetching content', error));
}

function init() {
  setUpMessaging();
  storage.init();
  fileServer.init();
  fetchContent();
}

function testWhiteScreen() {
  const webview = document.querySelector('webview');
  webview.captureVisibleRegion({format: 'png'}, (dataUrl) => {
    util.dataUrlToImageData(dataUrl).then((image) => {
      const white = new Uint8Array(image.data.length)
      for (let i = 0; i < image.byteLength; i++) { // eslint-disable-line
        white[i] = 255;
      }

      const diff = pixelmatch(image.data, white, null, image.width, image.height);
      console.log('diff', diff);
    });
  });
}

window.testWhiteScreen = testWhiteScreen;

document.addEventListener('DOMContentLoaded', init);
