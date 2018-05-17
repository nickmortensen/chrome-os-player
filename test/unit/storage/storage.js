const sinon = require('sinon');

const downloadQueue = require('../../../src/storage/download-queue');
const watchlist = require('../../../src/storage/messaging/watch/watchlist');
const messaging = require('../../../src/storage/messaging/messaging');
const db = require('../../../src/storage/db');
const fileSystem = require('../../../src/storage/file-system');

const storage = require('../../../src/storage/storage');

const sandbox = sinon.createSandbox();

describe('Storage', () => {

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(messaging, 'init');
    sandbox.stub(downloadQueue, 'checkStaleFiles');
    sandbox.stub(watchlist, 'requestWatchlistCompare');
    sandbox.stub(db, 'start');
    sandbox.stub(fileSystem, 'clearLeastRecentlyUsedFiles').resolves();
  });

  it('should initialize storage messaging', () => {
    storage.init();

    sinon.assert.calledOnce(messaging.init);
  });

  it('should initialize download queue', () => {
    storage.init();

    sinon.assert.calledOnce(downloadQueue.checkStaleFiles);
  });

  it('should request watchlist compare', () => {
    storage.init();

    sinon.assert.calledOnce(watchlist.requestWatchlistCompare);
  });

  it('should start database', () => {
    storage.init();

    sinon.assert.calledOnce(db.start);
  });

  it('should clear cache', () => {
    storage.init();

    sinon.assert.calledOnce(fileSystem.clearLeastRecentlyUsedFiles);
  });

});
