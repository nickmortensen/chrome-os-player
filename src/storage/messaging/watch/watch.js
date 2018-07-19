const gcsValidator = require('gcs-filepath-validator');
const localMessaging = require('../local-messaging-helper');
const messagingServiceClient = require('../../../messaging/messaging-service-client');
const db = require("../../database/api");
const update = require("../update/update");
const logger = require('../../../logging/logger');

function handleFileWatchResult(message) {
  const {filePath, version, token} = message;

  logger.log(`storage - received version ${version} for ${filePath}`);

  const status = token ? 'STALE' : 'CURRENT';

  return update.updateWatchlistAndMetadata({filePath, version, status, token})
  .then(() => localMessaging.sendFileUpdate({filePath, status, version}));
}

function handleFolderWatchResult(message) {
  logger.log(`storage - handling folder watch result ${JSON.stringify(message)}`);

  const {folderData} = message;

  return Promise.all(folderData.map(fileData => handleFileWatchResult(fileData)));
}

function processFileWatch(message, existingMetadata) {
  const metadata = existingMetadata || {filePath: message.filePath};
  metadata.status = metadata.status || "UNKNOWN";

  logger.log(`storage - processing watch for file ${JSON.stringify(metadata)}`);

  if (metadata.status === "UNKNOWN") {
    return requestMSUpdate(message, metadata);
  }

  return Promise.resolve(localMessaging.sendFileUpdate({
    filePath: message.filePath,
    status: metadata.status,
    version: metadata.version
  }));
}

function processFolderWatch(message, existingMetadata) {
  const folderPath = message.filePath;
  if (existingMetadata) {
    const folderFiles = db.fileMetadata.getFolderFiles(folderPath);
    logger.log(`storage - processing watch for existing folder ${folderPath}, ${JSON.stringify(folderFiles)}`);
    const promises = folderFiles.map(fileMetadata => processFileWatch({filePath: fileMetadata.filePath}, fileMetadata));
    return Promise.all(promises);
  }

  return requestMSUpdate(message, {filePath: folderPath});
}

function requestMSUpdate(message, metaData) {
  logger.log('storage - requesting MS update', metaData);

  const msMessage = Object.assign({}, message, {version: metaData.version || "0"});

  return db.fileMetadata.put(metaData)
  .then(()=>{
    messagingServiceClient.send(msMessage)
  });
}

function processFileOrFolderWatch(message) {
  const {filePath} = message;

  const existingMetadata = db.fileMetadata.get(filePath);
  const isFolder = filePath.endsWith("/");
  const action = isFolder ? processFolderWatch : processFileWatch;

  return action(message, existingMetadata);
}

module.exports = {
  process(message) {
    const filePath = message.filePath;
    logger.log(`storage - received watch for ${filePath}`);

    if (!gcsValidator.validateFilepath(filePath)) {
      return Promise.reject(new Error('Invalid watch message'));
    }

    return processFileOrFolderWatch(message)
      .then(() => db.fileMetadata.updateWatchSequence(filePath));
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
  requestMSUpdate
};
