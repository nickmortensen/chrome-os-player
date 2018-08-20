const logger = require('./logging/logger');

const MAX_DEGREE = 360;

function hasOrientation(content) {
  if (!(content && content.display && content.display.orientation)) {
    logger.log('no orientation in display settings');
    return false;
  }

  return true;
}

function setupOrientation(content) {
  if (!hasOrientation(content)) {return;}

    chrome.system.display.getInfo((displays) => {

        const rotation = content.display.orientation;

        if (rotation !== displays[0].rotation) {
            const info = {rotation: 0};
            info.rotation = rotation % MAX_DEGREE;
            logger.log(`changing orientation from ${displays[0].rotation} to ${info.rotation}`);
            chrome.system.display.setDisplayProperties(displays[0].id, info);
        }
    });
}

module.exports = {
  setupOrientation
}
