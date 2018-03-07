const logger = require('./logging/logger');

const dataHandlerRegisteredObserver = {resolve: () => {}, messageReceived: false};

function handleMessage(data) {
  if (data.from !== 'viewer') {
    return;
  }

  if (data.message === 'viewer-config') {
    logger.logClientInfo(data);
  } else if (data.message === 'data-handler-registered') {
    dataHandlerRegisteredObserver.messageReceived = true;
    dataHandlerRegisteredObserver.resolve();
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
  handleMessage,
  viewerCanReceiveContent
}
