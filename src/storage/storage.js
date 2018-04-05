const messaging = require('./messaging/messaging');
const downloadQueue = require('./download-queue');
const watchlist = require('./messaging/watch/watchlist');
const db = require('./db');

function init() {
  messaging.init();
  downloadQueue.checkStaleFiles();
  watchlist.requestWatchlistCompare();
  db.start();
}

module.exports = {
  init
}
