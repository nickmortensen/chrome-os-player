
const logger = require('./logging/logger');

const MILLISECONDS = 1000;

function scheduleRebootFromViewerContents(content, nowDate = Date.now()) {
  if (!(content && content.display && content.display.restartEnabled)) {
    return;
  }

  if (!(content.display.restartTime && content.display.restartTime.includes(':'))) {
    logger.log('scheduled reboot error', `invalid reboot schedule time: ${content.display.restartTime}`);
    return;
  }

  const rebootDate = parseRebootDate(content.display.restartTime);
  const seconds = Math.floor((rebootDate - nowDate) / MILLISECONDS);

  console.log(`scheduling reboot for ${rebootDate} in ${seconds} seconds from now`);
  chrome.runtime.restartAfterDelay(seconds);
}

function parseRebootDate(restartHHMM) {
  const rebootDate = new Date();
  rebootDate.setHours(parseInt(restartHHMM.split(":")[0], 10));
  rebootDate.setMinutes(parseInt(restartHHMM.split(":")[1], 10));
  if (rebootDate < new Date()) {rebootDate.setDate(rebootDate.getDate() + 1);}
  return rebootDate;
}

module.exports = {
  scheduleRebootFromViewerContents
}
