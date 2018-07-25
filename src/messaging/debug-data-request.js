const logger = require("../logging/logger");
const database = require("../storage/database/api");
const fileSystem = require("../storage/file-system");
const MAXLEN = 950000;
const messagingServiceClient = require('./messaging-service-client');

module.exports = {
  init() {
    messagingServiceClient.on('DEBUG-DATA-REQUEST', ()=>{
      const debugData = {};

      fileSystem.readDirEntries('cache')
      .then(files=>{
        debugData.files = files.map(({name})=>({name}))
      })
      .then(()=>debugData.databaseContents = database.getEntireDBObject())
      .then(()=>{
        const logData = JSON.stringify(debugData);
        const dataLen = logData.length;
        const bqDetails = dataLen < MAXLEN ? logData : `too large: ${dataLen}`

        logger.log('debug-data-request', bqDetails)
      })
    })
  }
}
