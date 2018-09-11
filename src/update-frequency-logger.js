const contentComparison = require('./content-comparison');
const logger = require('./logging/logger');

module.exports = {
  logContentChanges(contentData) {
    contentComparison.compareContentData(contentData)
    .then(result=>{
      if (!result) {return}

      const {aPresentationHasChanged, theScheduleHasChanged} = result;

      if (aPresentationHasChanged) {logger.log('presentation updated');}
      if (theScheduleHasChanged) {logger.log('schedule updated');}
    })
    .catch(err=>logger.error('player - error comparing content.json data', err));
  }
};
