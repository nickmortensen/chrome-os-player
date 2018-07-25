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

function readMetadata() {
  const metadata = db.getCollection("metadata");
  const validPersistedFileStates = ["CURRENT", "UNKNOWN"];
  const promises = metadata.find({status: {"$in": validPersistedFileStates}})
    .filter(entry => entry.filePath.endsWith("/"))
    .map(entry => {
      return util.sha1(`${entry.filePath}${entry.version}`).then(fileName => {return {entry, fileName}});
    });
  return Promise.all(promises);
}

function syncCacheMetadataWithFileSystem() {
  const metadataCollection = db.getCollection("metadata");
  return Promise.all([readMetadata(), fileSystem.readDirEntries('cache')])
    .then(([metadata, files]) => {
      const fileNames = files.map(file => file.name);
      metadata.filter(({fileName}) => {
        return fileNames.indexOf(fileName) < 0;
      })
      .forEach(({entry}) => {
        logger.log("storage - File not found in cache dir. Marking it as unknown in the database", entry);
        metadataCollection.update(Object.assign({}, entry, {status: "UNKNOWN", version: "0"}));
      });
    })
    .catch(err => logger.error("storage - Error when reading cache dir to sync metadata database", err));
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
  },
  serialize: ()=>db.serialize()
};
