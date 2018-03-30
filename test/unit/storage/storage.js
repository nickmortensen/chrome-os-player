const assert = require('assert');
const sinon = require('sinon');

const messagingServiceClient = require('../../../src/messaging/messaging-service-client');
const fileDownloader = require('../../../src/storage/file-downloader');
const db = require('../../../src/storage/db');

const storage = require('../../../src/storage/storage');

const sandbox = sinon.createSandbox();

describe('Storage', () => {

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(db.fileMetadata, 'put');
    sandbox.stub(db.watchlist, 'put');
  })

  describe('init', () => {

    const filePath = 'test-path';
    const version = 'version';
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

    it('should download file on MSFILEUPDATE add message', () => {
      const message = {filePath, version, token, type: 'ADD', topic: 'MSFILEUPDATE'};

      sandbox.stub(fileDownloader, 'download').resolves();
      sandbox.stub(messagingServiceClient, 'on').withArgs('MSFILEUPDATE').yields(message);

      storage.init();

      sinon.assert.calledWith(fileDownloader.download, {filePath, version, token});
    });

    it('should download file on MSFILEUPDATE update message', () => {
      const message = {filePath, version, token, type: 'UPDATE', topic: 'MSFILEUPDATE'};

      sandbox.stub(fileDownloader, 'download').resolves();
      sandbox.stub(messagingServiceClient, 'on').withArgs('MSFILEUPDATE').yields(message);

      storage.init();

      sinon.assert.calledWith(fileDownloader.download, {filePath, version, token});
    });

    it('should add entry to metadata and watchlist db collections on MSFILEUPDATE update message', () => {
      const message = {filePath, version, token, type: 'UPDATE', topic: 'MSFILEUPDATE'};

      sandbox.stub(fileDownloader, 'download').resolves();
      sandbox.stub(messagingServiceClient, 'on').withArgs('MSFILEUPDATE').yields(message);

      storage.init();

      sinon.assert.calledWith(db.watchlist.put, {filePath, version, token});
      sinon.assert.calledWith(db.fileMetadata.put, {filePath, version, token});
    });

    it('should add entry to metadata and watchlist db collections on MSFILEUPDATE add message', () => {
      const message = {filePath, version, token, type: 'UPDATE', topic: 'MSFILEUPDATE'};

      sandbox.stub(fileDownloader, 'download').resolves();
      sandbox.stub(messagingServiceClient, 'on').withArgs('MSFILEUPDATE').yields(message);

      storage.init();

      sinon.assert.calledWith(db.watchlist.put, {filePath, version, token});
      sinon.assert.calledWith(db.fileMetadata.put, {filePath, version, token});
    });
  });

  describe('watch', () => {

    it('should reject invalid watch message', () => {
      const filePath = 'invalid';
      return storage.watch(filePath)
        .then(assert.fail)
        .catch((error) => {
          assert.equal(error.message, 'Invalid watch message');
        });
    });
  });

});
