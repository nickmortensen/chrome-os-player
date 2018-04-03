const viewerMessaging = require('../messaging/viewer-messaging');
const fileServer = require('./file-server');

function sendFileUpdate(filePath, metaData) {
  return fileServer.getFileUrl(filePath, metaData.version).then(fileUrl => {
    viewerMessaging.send({topic: 'FILE-UPDATE', from: 'local-messaging', ospath: fileUrl, filePath, status: metaData.status, version: metaData.version});
  });
}

function on(event, handler) {
  return viewerMessaging.on(event, handler);
}

module.exports = {
  on,
  sendFileUpdate
}
