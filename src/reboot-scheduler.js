const launchEnvs = require("./launch-environment");
const logger = require('./logging/logger');

const MILLISECONDS = 1000;

function shouldSchedule(content) {
  if (!(content && content.display && content.display.restartEnabled)) {
    return false;
  }

  if (!launchEnvs.isKioskSession()) {return false;}

  if (!(content.display.restartTime && content.display.restartTime.includes(':'))) {
    logger.log('scheduled reboot error', `invalid reboot schedule time: ${content.display.restartTime}`);
    return false;
  }

  return true;
}

function scheduleRebootFromViewerContents(content, nowDate = Date.now()) {
  if (!shouldSchedule(content)) {return;}

  const rebootDate = parseRebootDate(content.display.restartTime);
  const seconds = Math.floor((rebootDate - nowDate) / MILLISECONDS);

  logger.log(`scheduling reboot for ${rebootDate} in ${seconds} seconds from now`);
  chrome.runtime.restartAfterDelay(seconds);
}

function parseRebootDate(restartHHMM) {
  const rebootDate = new Date();
  rebootDate.setHours(parseInt(restartHHMM.split(":")[0], 10));
  rebootDate.setMinutes(parseInt(restartHHMM.split(":")[1], 10));
  if (rebootDate < new Date()) {rebootDate.setDate(rebootDate.getDate() + 1);}
  return rebootDate;
}

function rebootNow() {
  if (launchEnvs.isKioskSession()) {
    logger.log('rebooting');
    chrome.runtime.restart();
  }
}

module.exports = {
  scheduleRebootFromViewerContents,
  rebootNow
}
