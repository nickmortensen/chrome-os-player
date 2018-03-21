const messagingServiceClient = require('../messaging/messaging-service-client');
const fileDownloader = require('./file-downloader');
const db = require('./db');

function processUpdate(message) {
  const {filePath, version, token} = message;
  console.log(`Received updated version ${version} for ${filePath}`);
  console.log(`Token timestamp ${token.data.timestamp}`);

  const entry = {filePath, version, token};

  return Promise.all([db.watchlist.put(entry), db.fileMetadata.put(entry), fileDownloader.download(entry)]);
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
  console.log('handle watch', message);
  return Promise.resolve({});
}

module.exports = {
  init,
  watch
}
