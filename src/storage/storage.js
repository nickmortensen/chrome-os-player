const messaging = require('./messaging/messaging');
const downloadQueue = require('./download-queue');
const watchlist = require('./messaging/watch/watchlist');
const db = require('./db');
const fileSystem = require('./file-system');

function init() {
  messaging.init();
  downloadQueue.checkStaleFiles();
  watchlist.requestWatchlistCompare();
  db.start();
  fileSystem.clearLeastRecentlyUsedFiles('cache');
}

module.exports = {
  init
}
