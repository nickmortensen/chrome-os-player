const db = require('./db');
const queueCheckInterval = 5000;
const fileDownloader = require('./file-downloader');
const localMessaging = require('./messaging/local-messaging-helper');
const logger = require('../logging/logger');

function checkStaleFiles(timer = setTimeout) {
  const staleEntries = db.fileMetadata.getStale();
  if (!staleEntries.length) {
    return intervalCheck();
  }
  const entry = staleEntries[0];
  return processEntry(entry)
    .then(() => checkStaleFiles(timer))
    .catch((err)=>{
      logger.error(`error downloading entry filePath: ${entry.filePath} version: ${entry.version}`, err);
      return intervalCheck();
    });

  function intervalCheck() {
    return Promise.resolve(timer(checkStaleFiles.bind(null, timer), queueCheckInterval));
  }
}

function processEntry(entry) {
  const {filePath, version} = entry;
  return fileDownloader.download(entry)
    .then(() => updateMetadata(version, filePath))
    .then((metadata) => localMessaging.sendFileUpdate(metadata));
}

function updateMetadata(downloadedVersion, filePath) {
  const metadata = db.fileMetadata.get(filePath);
  const currentVersion = metadata && metadata.version;
  const newStatus = currentVersion === downloadedVersion ? 'CURRENT' : 'STALE';
  return db.fileMetadata.put({filePath, status: newStatus});
}

module.exports = {
  checkStaleFiles
}
