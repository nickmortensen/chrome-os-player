const messaging = require('./messaging/messaging');
const downloadQueue = require('./download-queue');
const watchlist = require('./messaging/watch/watchlist');
const db = require('./database/lokijs/database');
const fileSystem = require('./file-system');
const expiration = require('./expiration');
const logger = require('../logging/logger');

function init() {
  return fileSystem.clearLeastRecentlyUsedFiles('cache')
    .then(() => db.start())
    .then(() => expiration.cleanExpired())
    .then(() => {
      messaging.init();
      expiration.requestUnwatchExpired();
      watchlist.requestWatchlistCompare();
      downloadQueue.checkStaleFiles();
      expiration.scheduleIncreaseSequence();
    })
    .catch(error => logger.error('storage - error when starting', error));
}

module.exports = {
  init
}
