const db = require("../../db");
const entry = require("./entry");
const localMessaging = require('../local-messaging-helper');

module.exports = {
  updateWatchlistAndMetadata(dbEntry) {
    db.fileMetadata.put(dbEntry)
    db.watchlist.put(dbEntry);

    return Promise.resolve();
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

    console.log(`received ${type} version ${version} for ${filePath}`);
    console.log(`token timestamp ${token.data.timestamp}`);

    if (!entry.validate(message)) {
      return Promise.reject(new Error(`Invalid ${type} message`));
    }

    return Promise.resolve(message);
  }
};
