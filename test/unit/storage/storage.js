const sinon = require('sinon');

const messagingServiceClient = require('../../../src/messaging/messaging-service-client');
const fileDownloader = require('../../../src/storage/file-downloader');

const storage = require('../../../src/storage/storage');

const sandbox = sinon.createSandbox();

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

describe('Storage', () => {

  afterEach(() => sandbox.restore());

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

});
