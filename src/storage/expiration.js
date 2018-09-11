const db = require("./database/api");
const fileSystem = require("./file-system");
const logger = require("../logging/logger");
const util = require('../util');

const SEQUENCE_TIMEOUT = 30 * 60 * 1000; // eslint-disable-line no-magic-numbers

function cleanFolderContents(filePath) {
  const folderFileNames = db.fileMetadata.getFolderFiles(filePath)
  .map(entry => entry.filePath);

  return Promise.all(folderFileNames.map(clean));
}

function clean(filePath) {
  return Promise.resolve()
  .then(() => {
    const version = db.watchlist.get(filePath, "version");
    const isFolder = filePath.endsWith("/");

    return (isFolder ? cleanFolderContents(filePath) : Promise.resolve())
    .then(() => {
      logger.log('storage - expiration', `removing metadata and contents for ${filePath} | ${version}`);

      return db.deleteAllDataFor(filePath);
    })
    .then(() => {
      if (isFolder || !version) {
        return;
      }

      return util.sha1(`${filePath}${version}`)
      .then(fileName => fileSystem.removeCachedFile(fileName))
      .catch(error => logger.log("warning", error.stack));
    });
  })
  .catch(error => logger.error(`storage - error while removing expired file metadata`, error, {filePath}));
}

function cleanExpired() {
  return Promise.resolve()
  .then(() => {
    logger.log('storage - expiration', 'checking expired metadata and files');

    const expired = db.fileMetadata.find({watchSequence: {"$gt": 0}})
    .filter(db.watchlist.shouldBeExpired);

    return Promise.all(expired.map(entry => clean(entry.filePath)));
  })
  .then(() => logger.log('storage - expiration', 'ending check'))
  .catch(error => logger.error('storage - error while cleaning expired entries and files', error));
}

function scheduleIncreaseSequence(schedule = setTimeout) {
  schedule(() => {
    const updatedSequence = db.watchlist.increaseRuntimeSequence();

    logger.log('storage - increasing runtime sequence', updatedSequence.toString());
  }, SEQUENCE_TIMEOUT);
}

module.exports = {
  cleanExpired,
  scheduleIncreaseSequence
};
