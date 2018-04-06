const gcsValidator = require('gcs-filepath-validator');
const localMessaging = require('../local-messaging-helper');
const messagingServiceClient = require('../../../messaging/messaging-service-client');
const db = require("../../db");
const update = require("../update/update");


function handleFileWatchResult(message) {
  const {filePath, version, token} = message;

  console.log(`received version ${version} for ${filePath}`);

  const status = token ? 'STALE' : 'CURRENT';

  return update.updateWatchlistAndMetadata({filePath, version, status, token})
  .then(() => localMessaging.sendFileUpdate({filePath, status, version}));
}

function handleFolderWatchResult(message) {
  const {folderData} = message;

  return Promise.all(folderData.map(fileData => handleFileWatchResult(fileData)));
}

module.exports = {
  process(message) {
    const filePath = message.filePath;
    console.log(`received watch for ${filePath}`);
    if (!gcsValidator.validateFilepath(filePath)) {
      return Promise.reject(new Error('Invalid watch message'));
    }

    const metaData = db.fileMetadata.get(filePath) || {filePath};
    metaData.status = metaData.status || 'UNKNOWN';

    if (metaData.status === 'UNKNOWN') {
      return module.exports.requestMSUpdate(message, metaData);
    }

    return localMessaging.sendFileUpdate(metaData);
  },
  msResult(message) {
    const {filePath, error, folderData, watchlistLastChanged} = message;

    if (error) {
      return localMessaging.sendFileUpdate({filePath, status: "NOEXIST"});
    }

    const action = folderData ? handleFolderWatchResult : handleFileWatchResult;

    return action(message)
      .then(() => db.watchlist.setLastChanged(watchlistLastChanged));
  },
  requestMSUpdate(message, metaData) {
    const msMessage = Object.assign({}, message, {version: metaData.version || '0'});
    metaData.status = metaData.status === 'UNKNOWN' ? 'PENDING' : metaData.status;

    db.fileMetadata.put(metaData);
    messagingServiceClient.send(msMessage)

    return Promise.resolve();
  }
};
