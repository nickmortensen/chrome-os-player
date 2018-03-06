const logger = require('./logging/logger');
const gcsClient = require('./gcs-client');

let sendMessage = () => {}; // eslint-disable-line func-style

function init(webview) {
  sendMessage = (message) => {
    webview.contentWindow.postMessage(Object.assign({from: 'player'}, message), webview.src);
  }
}

function handleMessage(data) {
  if (data.from !== 'viewer') {
    return;
  }

  if (data.message === 'viewer-config') {
    logger.logClientInfo(data);
  } else if (data.message === 'data-handler-registered') {
    chrome.storage.local.get((items) => {
      const bucketName = 'risevision-display-notifications';
      const filePath = `${items.displayId}/content.json`;
      gcsClient.fetchJson(bucketName, filePath)
        .then((contentData) => sendMessage({topic: 'content-update', newContent: contentData}));
    });
  }
}

module.exports = {
  init,
  handleMessage
}
