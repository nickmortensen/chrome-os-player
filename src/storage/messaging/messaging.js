const messagingServiceClient = require('../../messaging/messaging-service-client');
const localMessaging = require('./local-messaging-helper');
const add = require("./add/add");
const deleteFile = require("./delete/delete");
const update = require("./update/update");
const watch = require("./watch/watch");
const watchlist = require("./watch/watchlist");
const logger = require("../../logging/logger");

const actions = {ADD: add, UPDATE: update, DELETE: deleteFile};

function logError(err, userFriendlyMessage = "", filePath) {
  logger.error(userFriendlyMessage, err, {filePath});
}

function init() {
  localMessaging.on('WATCH', handleWatch);
  messagingServiceClient.on('MSFILEUPDATE', handleMSFileUpdate);
  messagingServiceClient.on('WATCH-RESULT', handleWatchResult);
  messagingServiceClient.on('WATCHLIST-RESULT', handleWatchlistResult)
}

function handleWatch(message) {
  return watch.process(message)
    .catch((err) => {
      logError(err, "storage - handle WATCH Error", message.filePath);
    });
}

function handleWatchResult(message) {
  return watch.msResult(message)
  .catch((err) => {
    logError(err, "storage - handle WATCH-RESULT Error", message.filePath);
  });
}

function handleWatchlistResult(message) {
  return watchlist.refresh(message.watchlist, message.lastChanged)
  .catch((err) => {
    logError(err, "storage - handle WATCHLIST-RESULT Error", "");
  });
}

function handleMSFileUpdate(message) {
  if (!message.type) {return Promise.reject(new Error('Invalid file update message'));}

  const type = message.type.toUpperCase();
  const action = actions[type];

  if (!action) {return Promise.reject(new Error('Invalid file update message'));}

  return action.process(message)
  .catch(err => {
    logError(err, `storage - handle MSFILEUPDATE ${type} Error`, message.filePath);
  });
}

module.exports = {
  init,
  handleWatch,
  handleWatchResult,
  handleMSFileUpdate
};
