const logger = require('./logging/logger');
// const localStorage = require('./local-storage');

const dataHandlerRegisteredObserver = {resolve: () => {}, messageReceived: false};

let messageSender = null;

function createMessageSender(webview) {
  return {
    sendMessage(message) {
      webview.contentWindow.postMessage(message, webview.src);
    }
  }
}

function init(webview) {
  messageSender = createMessageSender(webview);
}

function sendMessage(message) {
  if (messageSender) {
    messageSender.sendMessage(message);
  }
}

function handleViewerMessage(data) {
  if (data.message === 'viewer-config') {
    logger.logClientInfo(data);
  } else if (data.message === 'data-handler-registered') {
    dataHandlerRegisteredObserver.messageReceived = true;
    dataHandlerRegisteredObserver.resolve();
  }
}

function handleLocalMessagingMessage(data) {
  if (data.topic === 'client-list-request') {
    const installedClients = ['local-storage', 'local-messaging'];
    const message = {from: 'local-messaging', topic: 'client-list', installedClients, clients: installedClients};
    sendMessage(message);
  } else if (data.topic === 'WATCH') {
    // localStorage.watch(data.filePath).then((result) => sendMessage(result));
  }
}

function handleMessage(data) {
  if (data.from === 'viewer') {
    handleViewerMessage(data);
  } else if (data.from === 'ws-client') {
    handleLocalMessagingMessage(data);
  }
}

function viewerCanReceiveContent() {
  return new Promise(resolve => {
    dataHandlerRegisteredObserver.resolve = resolve;
    if (dataHandlerRegisteredObserver.messageReceived) {
      resolve();
    }
  });
}

module.exports = {
  init,
  sendMessage,
  handleMessage,
  viewerCanReceiveContent
}
