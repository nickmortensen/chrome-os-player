const messagingServiceClient = require('../messaging/messaging-service-client');
const fileDownloader = require('./file-downloader');
const db = require('./db');
const gcsValidator = require('gcs-filepath-validator');

function processUpdate(message) {
  const {filePath, version, token} = message;
  console.log(`Received updated version ${version} for ${filePath}`);
  console.log(`Token timestamp ${token.data.timestamp}`);

  const entry = {filePath, version, token};

  db.watchlist.put(entry);
  db.fileMetadata.put(entry);

  return fileDownloader.download(entry);
}

function handleMSFileUpdate(message) {
  if (!message.type) {return;}

  if (message.type.toUpperCase() === 'ADD' || message.type.toUpperCase() === 'UPDATE') {
    return processUpdate(message)
      .catch((err) => console.error('Handle MSFILEUPDATE Error', message.filePath, err));
  }
}

function init() {
  messagingServiceClient.on('MSFILEUPDATE', message => handleMSFileUpdate(message));
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
  watch
}
