const viewerMessaging = require('../../messaging/viewer-messaging');
const fileServer = require('../file-server');
const logger = require('../../logging/logger');

const localListeners = [];

function sendFileUpdate(metaData) {
  const {filePath, version} = metaData;
  return fileServer.getFileUrl(filePath, version).then(fileUrl => {
    const message = {topic: 'FILE-UPDATE', from: 'local-storage', ospath: fileUrl, osurl: fileUrl, filePath, status: metaData.status, version};
    logger.log('storage - sending FILE-UPDATE to viewer', message);
    localListeners.forEach(listener=>listener(message));
    return viewerMessaging.send(message);
  });
}

function sendFileError(data) {
  const message = Object.assign({topic: 'FILE-ERROR', from: 'local-storage'}, data);
  logger.log('storage - sending FILE-ERROR to viewer', message);
  localListeners.forEach(listener=>listener(message));
  return Promise.resolve(viewerMessaging.send(message));
}

function on(event, handler) {
  return viewerMessaging.on(event, handler);
}

function registerLocalListener(fn) {
  localListeners.push(fn);
}

module.exports = {
  registerLocalListener,
  on,
  sendFileUpdate,
  sendFileError
}
