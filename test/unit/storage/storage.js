const sinon = require('sinon');

const downloadQueue = require('../../../src/storage/download-queue');
const watchlist = require('../../../src/storage/messaging/watch/watchlist');
const messaging = require('../../../src/storage/messaging/messaging');
const db = require('../../../src/storage/database/lokijs/database');
const fileSystem = require('../../../src/storage/file-system');
const expiration = require('../../../src/storage/expiration');

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
    sandbox.stub(expiration, 'cleanExpired').resolves();
    sandbox.stub(expiration, 'scheduleIncreaseSequence').resolves();
  });

  it('should initialize storage messaging', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(messaging.init);
    });
  });

  it('should initialize download queue', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(downloadQueue.checkStaleFiles);
    });
  });

  it('should request watchlist compare', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(watchlist.requestWatchlistCompare);
    });
  });

  it('should start database', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(db.start);
    });
  });

  it('should clear cache', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(fileSystem.clearLeastRecentlyUsedFiles);
    });
  });

  it('should clean expired files', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(expiration.cleanExpired);
    });
  });

  it('should schedule sequence increase', () => {
    return storage.init().then(() => {
      sinon.assert.calledOnce(expiration.scheduleIncreaseSequence);
    });
  });

});
