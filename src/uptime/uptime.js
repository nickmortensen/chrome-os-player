const scheduleParser = require('./schedule-parser');
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
  logger.log('uptime', {shouldBePlaying});
}

module.exports = {
  setSchedule,
  calculate
};
