const viewerMessaging = require('../messaging/viewer-messaging');

function init() {
  viewerMessaging.on('storage-licensing-request', () => {
    const message = {from: 'local-messaging', topic: 'storage-licensing-update', isAuthorized: true};
    viewerMessaging.send(message);
  });
}

module.exports = {
  init
}
