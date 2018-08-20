const logger = require('./logging/logger');

const MILLISECONDS = 1000;

function hasOrientation(content) {
  if (!(content && content.display && content.display.orientation)) {
    logger.log('no orientation in display settings');
    return false;
  }

  return true;
}

function setupOrientation(content, nowDate = Date.now()) {
  if (!hasOrientation(content)) {return;}

    chrome.system.display.getInfo(function(displays) {
        
        const rotation = content.display.orientation;
        
        if(rotation != displays[0].rotation) {
            var info = {rotation:0};
            info.rotation = rotation % 360;
            logger.log(`changing orientation from ${displays[0].rotation} to ${info.rotation}`);
            chrome.system.display.setDisplayProperties(displays[0].id, info, function() {
                //
            });
        }
    });
}

module.exports = {
  setupOrientation
}
