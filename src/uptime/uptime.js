const scheduleParser = require('./schedule-parser');
const messagingServiceClient = require('../messaging/messaging-service-client');
const logger = require('../logging/logger');

let schedule = null;

function setSchedule(data) {
  console.log('uptime - setSchedule', data);
  if (data && data.content && data.content.schedule) {
    schedule = data.content.schedule;
  }
}

function calculate() {
  if (!schedule) {
    logger.error('uptime - schedule not set');
    return;
  }

  const shouldBePlaying = scheduleParser.canPlay(schedule);
  const connectedToMS = messagingServiceClient.isConnected();
  logger.log('uptime', {shouldBePlaying, connectedToMS});
}

module.exports = {
  setSchedule,
  calculate
};
