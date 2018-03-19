const messagingServiceClient = require('../messaging/messaging-service-client');
const fileDownloader = require('./file-downloader');

function processUpdate(message) {
  const {filePath, version, token} = message;
  console.log(`Received updated version ${version} for ${filePath}`);
  console.log(`Token timestamp ${token.data.timestamp}`);

  return fileDownloader.download({filePath, version, token})
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

module.exports = {
  init
}
