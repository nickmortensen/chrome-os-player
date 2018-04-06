const localMessaging = require('../local-messaging-helper');
const db = require("../../db");
const gcsValidator = require("gcs-filepath-validator");

module.exports = {
  process(message) {
    const {filePath, watchlistLastChanged} = message;

    if (!gcsValidator.validateFilepath(filePath)) {
      return Promise.reject(new Error("Invalid delete message"));
    }


    return db.fileMetadata.delete(filePath)
      .then(() => db.watchlist.delete(filePath))
      .then(() => db.watchlist.setLastChanged(watchlistLastChanged))
      .then(() => localMessaging.sendFileUpdate({
        filePath,
        status: "DELETED"
      }));
  }
};
