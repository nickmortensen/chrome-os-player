const COLLECTIONS = ["metadata", "runtime_info", "watchlist"];

const loki = require("lokijs");
const LokiIndexedAdapter = require("lokijs/src/loki-indexed-adapter");
const fileSystem = require("../../file-system");
const util = require("../../../util");
const logger = require("../../../logging/logger");

const DB_FILENAME = 'local-storage.db';
const defaultSaveInterval = 4000;

let db = null;

function initCollections() {
  COLLECTIONS.forEach((collName)=>{
    const collection = db.getCollection(collName);

    if (!collection) {
      db.addCollection(collName, {
        unique: ["filePath"]
      });
    }
  });
}

function initLokijs(saveInterval) {
  return new Promise((res, rej)=>{
    try {
      const idbAdapter = new LokiIndexedAdapter();
      db = new loki(DB_FILENAME, {
        adapter: idbAdapter,
        autoload: true,
        autoloadCallback: ()=>{
          initCollections();
          res();
        },
        autosave: true,
        autosaveInterval: saveInterval,
        env: "BROWSER"
      });
    } catch (err) {
      rej(err);
    }
  });
}

function readCurrentFilesMetadata() {
  const metadata = db.getCollection("metadata");
  const promises = metadata.find({status: "CURRENT"}).map(entry => {
    return util.sha1(`${entry.filePath}${entry.version}`).then(fileName => {return {entry, fileName}});
  })
  return Promise.all(promises);
}

function syncCacheMetadataWithFileSystem() {
  return Promise.all([readCurrentFilesMetadata(), fileSystem.readDirEntries('cache')])
    .then(([metadata, files]) => {
      const fileNames = files.map(file => file.name);
      metadata.filter(({fileName}) => {
        return fileNames.indexOf(fileName) < 0;
      })
      .forEach(({entry}) => {
        logger.log("File not found in cache dir. Marking it as unknown in the database", JSON.stringify(entry));
        metadata.update(Object.assign({}, entry, {status: "UNKNOWN", version: "0"}));
      });
    })
    .catch(() => logger.log("Error when reading cache dir to sync metadata database"));
}

module.exports = {
  close(cb) {
    if (db) {
      db.close(cb);
    }
  },
  destroy(cb = ()=>{}) {
    if (db) {
      db.deleteDatabase(cb);
    }
  },
  start(saveInterval = defaultSaveInterval) {
    return initLokijs(saveInterval).then(() => syncCacheMetadataWithFileSystem());
  },
  getCollection(name) {
    return db.getCollection(name);
  }
};