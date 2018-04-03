const gcsValidator = require('gcs-filepath-validator');
const messagingServiceClient = require('../messaging/messaging-service-client');
const localMessaging = require('./local-messaging-helper');
const db = require('./db');
const downloadQueue = require('./download-queue');

function processUpdate(message, status) {
  const {filePath, version, token} = message;
  console.log(`Received updated version ${version} for ${filePath}`);

  const entry = {filePath, version, token, status};

  db.watchlist.put(entry);
  db.fileMetadata.put(entry);

  return Promise.resolve();
}

function handleMSFileUpdate(message) {
  if (!message.type) {return Promise.reject(new Error('Invalid file update message'));}

  if (message.type.toUpperCase() === 'ADD' || message.type.toUpperCase() === 'UPDATE') {
    return processUpdate(message, 'STALE')
      .catch((err) => console.error('Handle MSFILEUPDATE Error', message.filePath, err));
  }
}

function handleWatchResult(message) {
  const {filePath, version, token} = message;

  console.log(`received version ${version} for ${filePath}`);

  const status = token ? 'STALE' : 'CURRENT';

  return processUpdate(message, status)
    .then(() => localMessaging.sendFileUpdate(filePath, {filePath, version, status}));
}

function init() {
  messagingServiceClient.on('MSFILEUPDATE', handleMSFileUpdate);
  messagingServiceClient.on('WATCH-RESULT', handleWatchResult);
  localMessaging.on('WATCH', watch);
  downloadQueue.checkStaleFiles();
}

function watch(message) {
  const filePath = message.filePath;
  console.log(`received watch for ${filePath}`);
  if (!gcsValidator.validateFilepath(filePath)) {
    return Promise.reject(new Error('Invalid watch message'));
  }

  const metaData = db.fileMetadata.get(filePath) || {filePath};
  metaData.status = metaData.status || 'UNKNOWN';

  if (metaData.status === 'UNKNOWN') {
    return requestMSUpdate(message, metaData);
  }

  localMessaging.sendFileUpdate(filePath, metaData);

  return Promise.resolve();
}

function requestMSUpdate(message, metaData) {
  const msMessage = Object.assign({}, message, {version: metaData.version || '0'});
  metaData.status = metaData.status === 'UNKNOWN' ? 'PENDING' : metaData.status;

  db.fileMetadata.put(metaData);
  messagingServiceClient.send(msMessage)

  return Promise.resolve();
}

module.exports = {
  init,
  watch,
  handleWatchResult,
  handleMSFileUpdate
}
