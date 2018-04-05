const viewerMessaging = require('../../messaging/viewer-messaging');
const fileServer = require('../file-server');

function sendFileUpdate(metaData) {
  const {filePath, version} = metaData;
  return fileServer.getFileUrl(filePath, version).then(fileUrl => {
    const message = {topic: 'FILE-UPDATE', from: 'local-messaging', ospath: fileUrl, filePath, status: metaData.status, version};
    console.log(`sending FILE-UPDATE to viewer ${JSON.stringify(message)}`, metaData);
    viewerMessaging.send(message);
  });
}

function on(event, handler) {
  return viewerMessaging.on(event, handler);
}

module.exports = {
  on,
  sendFileUpdate
}
