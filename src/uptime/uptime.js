const messagingServiceClient = require('../messaging/messaging-service-client');
const viewerMessaging = require('../messaging/viewer-messaging');
const logger = require('../logging/logger');
const scheduleParser = require('./schedule-parser');

const pingTimeout = 3000;
const uptimeInterval = 300000;
let schedule = null;

function setSchedule(data) {
  if (data && data.content && data.content.schedule) {
    schedule = data.content.schedule;
  }
}

function checkRendererHealth() {
  return new Promise(resolve => {
    const pongTimeoutTimer = setTimeout(() => {
      viewerMessaging.removeAllListeners("renderer-pong");
      resolve(false);
    }, pingTimeout);

    viewerMessaging.once("renderer-pong", () => {
      clearTimeout(pongTimeoutTimer);
      resolve(true);
    });

    viewerMessaging.send({from: 'player', topic: 'renderer-ping'});
  });
}

function init() {
  setInterval(calculate, uptimeInterval);
}

function calculate() {
  if (!schedule) {
    logger.error('uptime - schedule not set');
    return;
  }

  checkRendererHealth().then(rendererResult => {
    const connectedToMS = messagingServiceClient.isConnected();
    const shouldBePlaying = scheduleParser.canPlay(schedule);
    logger.logUptime(connectedToMS, rendererResult, shouldBePlaying);
  })
  .catch(err => logger.error('uptime - error', err));
}

module.exports = {
  setSchedule,
  init
};
