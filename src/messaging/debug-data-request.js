const logger = require("../logging/logger");
const messagingServiceClient = require('./messaging-service-client');

module.exports = {
  init() {
    messagingServiceClient.on('DEBUG-DATA-REQUEST', ()=>{
      const debugData = {
        test: "test"
      };

      return logger.log('debug-data-request', JSON.stringify(debugData))
    })
  }
}
