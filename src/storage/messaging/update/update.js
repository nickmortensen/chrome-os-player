const db = require("../../database/api");
const entry = require("./entry");
const localMessaging = require('../local-messaging-helper');
const logger = require('../../../logging/logger');

module.exports = {
  updateWatchlistAndMetadata(dbEntry) {
    const promises = [
      db.fileMetadata.put(dbEntry),
      db.watchlist.put(dbEntry)
    ];

    return Promise.all(promises);
  },
  update(message) {
    const {filePath, version, token} = message;

    return module.exports.updateWatchlistAndMetadata({
      filePath, version, token, status: "STALE"
    })
    .then(()=> localMessaging.sendFileUpdate({filePath, status: "STALE", version}))
    .then(() => db.watchlist.setLastChanged(message.watchlistLastChanged));
  },
  process(message) {
    return module.exports.validate(message, "update")
    .then(module.exports.update);
  },
  validate(message, type) {
    const {filePath, version, token} = message;

    logger.log(`storage - received ${type} version ${version} for ${filePath}`, `token timestamp ${token.data.timestamp}`);

    if (!entry.validate(message)) {
      return Promise.reject(new Error(`Invalid ${type} message`));
    }

    return Promise.resolve(message);
  }
};
