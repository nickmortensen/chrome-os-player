const db = require('./db');
const queueCheckInterval = 5000;
const fileDownloader = require('./file-downloader');
const localMessaging = require('./local-messaging-helper');
const logger = require('../logging/logger');

const inProgress = new Set();

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
  if (inProgress.has(filePath)) {return Promise.resolve();}
  inProgress.add(filePath);
  return fileDownloader.download(entry)
    .then(() => updateMetadata(version, filePath))
    .then((metadata) => localMessaging.sendFileUpdate(filePath, metadata))
    .then(() => inProgress.delete(filePath))
    .catch((error) => {
      inProgress.delete(filePath);
      return Promise.reject(error);
    });
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
