const assert = require('assert');
const sinon = require('sinon');

const messagingServiceClient = require('../../../src/messaging/messaging-service-client');
const localMessaging = require('../../../src/storage/local-messaging-helper');
const db = require('../../../src/storage/db');

const storage = require('../../../src/storage/storage');

const sandbox = sinon.createSandbox();

describe('Storage', () => {

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(db.fileMetadata, 'put');
    sandbox.stub(db.watchlist, 'put');
  });

  const filePath = 'local-storage-test/test-1x1.png';
  const version = '1516908679637510';
  const token = {
    hash: 'abc123',
    data: {
      displayId: 'test-display-id',
      timestamp: Date.now(),
      filePath: 'test-path'
    }
  };

  it('should listen to MSFILEUPDATE message', () => {
    sandbox.stub(messagingServiceClient, 'on');

    storage.init();

    sinon.assert.calledWith(messagingServiceClient.on, 'MSFILEUPDATE');
  });

  it('should reject on invalid MSFILEUPDATE message', () => {
    const message = {filePath, version, token, topic: 'MSFILEUPDATE'};

    return storage.handleMSFileUpdate(message)
      .then(assert.fail)
      .catch((error) => {
        assert.equal(error.message, 'Invalid file update message');
      });
  });

  it('should add entry to metadata and watchlist db collections on MSFILEUPDATE update message', () => {
    const message = {filePath, version, token, type: 'UPDATE', topic: 'MSFILEUPDATE'};

    return storage.handleMSFileUpdate(message).then(() => {
      sinon.assert.calledWith(db.watchlist.put, {filePath, version, token, status: 'STALE'});
      sinon.assert.calledWith(db.fileMetadata.put, {filePath, version, token, status: 'STALE'});
    });
  });

  it('should add entry to metadata and watchlist db collections on MSFILEUPDATE add message', () => {
    const message = {filePath, version, token, type: 'ADD', topic: 'MSFILEUPDATE'};

    return storage.handleMSFileUpdate(message).then(() => {
      sinon.assert.calledWith(db.watchlist.put, {filePath, version, token, status: 'STALE'});
      sinon.assert.calledWith(db.fileMetadata.put, {filePath, version, token, status: 'STALE'});
    });
  });

  it('should listen to WATCH message', () => {
    sandbox.stub(localMessaging, 'on');

    storage.init();

    sinon.assert.calledWith(localMessaging.on, 'WATCH');
  });

  it('should reject invalid watch message', () => {
    const filePath = 'invalid'; // eslint-disable-line no-shadow
    return storage.watch({filePath})
      .then(assert.fail)
      .catch((error) => {
        assert.equal(error.message, 'Invalid watch message');
      });
  });

  it('should save metadata and request file update to messaging service on new watch message', () => {
    sandbox.stub(messagingServiceClient, 'send');
    sandbox.stub(localMessaging, 'sendFileUpdate');

    const expectedMessage = {filePath, version: '0'};

    return storage.watch({filePath}).then(() => {
      sinon.assert.calledWith(messagingServiceClient.send, expectedMessage);
      sinon.assert.notCalled(localMessaging.sendFileUpdate);
    });
  });

  it('should send file update message to viewer on watch message for existing file', () => {
    sandbox.stub(messagingServiceClient, 'send');
    sandbox.stub(localMessaging, 'sendFileUpdate');

    const metadata = {filePath, version, status: 'STALE'};
    sandbox.stub(db.fileMetadata, 'get').returns(metadata)

    return storage.watch({filePath}).then(() => {
      sinon.assert.calledWith(localMessaging.sendFileUpdate, filePath, metadata);
      sinon.assert.notCalled(messagingServiceClient.send);
    });
  });

  it('should listen to WATCH-RESULT message', () => {
    sandbox.stub(messagingServiceClient, 'on');

    storage.init();

    sinon.assert.calledWith(messagingServiceClient.on, 'WATCH-RESULT');
  });

  it('should send file update message to viewer on WATCH-RESULT message', () => {
    const message = {msg: 'ok', topic: 'watch-result', filePath, version, token, watchlistLastChanged: '1522699819330'};

    sandbox.stub(localMessaging, 'sendFileUpdate');

    return storage.handleWatchResult(message).then(() => {
      sinon.assert.calledWith(db.watchlist.put, {filePath, version, token, status: 'STALE'});
      sinon.assert.calledWith(db.fileMetadata.put, {filePath, version, token, status: 'STALE'});

      sinon.assert.calledWith(localMessaging.sendFileUpdate, filePath, {filePath, version, status: 'STALE'});
    });
  });
});
