const viewerMessaging = require('../../messaging/viewer-messaging');
const fileServer = require('../file-server');

const localListeners = [];

function sendFileUpdate(metaData) {
  const {filePath, version} = metaData;
  return fileServer.getFileUrl(filePath, version).then(fileUrl => {
    const message = {topic: 'FILE-UPDATE', from: 'local-storage', ospath: fileUrl, osurl: fileUrl, filePath, status: metaData.status, version};
    console.log(`sending FILE-UPDATE to viewer ${JSON.stringify(message)}`, metaData);
    localListeners.forEach(listener=>listener(message));
    return viewerMessaging.send(message);
  });
}

function sendFileError(data) {
  const message = Object.assign({topic: 'FILE-ERROR', from: 'local-storage'}, data);
  console.log(`sending FILE-ERROR to viewer ${JSON.stringify(message)}`, data);
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
