const assert = require('assert');
const sinon = require('sinon');

const fileSystem = require('../../../src/storage/file-system');
const urlProvider = require('../../../src/storage/url-provider');
const util = require('../../../src/util');

const fileDownloader = require('../../../src/storage/file-downloader');

const sandbox = sinon.createSandbox();
const fetch = sandbox.stub();

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

describe('File Downloader', () => {

  before(() => global.fetch = fetch);

  after(() => Reflect.deleteProperty(global, 'fetch'));

  afterEach(() => sandbox.restore());
  afterEach(() => fetch.reset());

  it('should download successfully', () => {
    const expectedFileEntry = {};

    sandbox.stub(fileSystem, 'writeFileToDirectory').resolves(expectedFileEntry);
    sandbox.stub(fileSystem, 'moveFileToDirectory').resolves(expectedFileEntry);
    sandbox.stub(fileSystem, 'checkAvailableDiskSpace').resolves(true);
    sandbox.stub(urlProvider, 'getUrl').resolves('http://risevision.com/test/file');
    sandbox.stub(util, 'sha1').resolves('fileName');

    const response = {ok: true, status: 200, headers: {get() {}}, body: 'body'};
    fetch.resolves(response);

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(fileEntry => {
        assert.equal(fileEntry, expectedFileEntry);
        sinon.assert.calledWith(fileSystem.writeFileToDirectory, 'fileName', response.body, 'download');
      });
  });

  it('should reject and not get signed url when no available space"', () => {
    sandbox.stub(fileSystem, 'checkAvailableDiskSpace').resolves(false);
    sandbox.stub(urlProvider, 'getUrl').resolves('http://risevision.com/test/file');

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Insufficient disk space');
        sinon.assert.notCalled(urlProvider.getUrl);
      });
  });

  it('should reject and not request file when requesting signed url fails', () => {
    sandbox.stub(fileSystem, 'checkAvailableDiskSpace').resolves(true);
    sandbox.stub(urlProvider, 'getUrl').rejects(Error('Invalid response with status code 500'));

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Invalid response with status code 500');
        sinon.assert.notCalled(fetch);
      });
  });

  it('should reject and not write file when file request returns invalid response', () => {
    sandbox.stub(fileSystem, 'writeFileToDirectory').resolves({});
    sandbox.stub(fileSystem, 'checkAvailableDiskSpace').resolves(true);
    sandbox.stub(urlProvider, 'getUrl').resolves('http://risevision.com/test/file');
    fetch.resolves({ok: false, status: 500, headers: {get() {}}});

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Invalid response with status code 500');
        sinon.assert.notCalled(fileSystem.writeFileToDirectory);
      });
  });

  it('should reject and not write file when file request rejects', () => {
    sandbox.stub(fileSystem, 'writeFileToDirectory').resolves({});
    sandbox.stub(fileSystem, 'checkAvailableDiskSpace').resolves(true);
    sandbox.stub(urlProvider, 'getUrl').resolves('http://risevision.com/test/file');
    sandbox.stub(util, 'fetchWithRetry').rejects(Error('Testing'));

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Testing');
        sinon.assert.notCalled(fileSystem.writeFileToDirectory);
      });
  });

  it('should reject and not write file when file request lenght exceeds available space', () => {
    sandbox.stub(fileSystem, 'writeFileToDirectory').resolves({});
    const checkAvailableDiskSpace = sandbox.stub(fileSystem, 'checkAvailableDiskSpace');
    checkAvailableDiskSpace.onFirstCall().resolves(true);
    checkAvailableDiskSpace.onSecondCall().resolves(false);
    sandbox.stub(urlProvider, 'getUrl').resolves('http://risevision.com/test/file');
    fetch.resolves({ok: true, status: 200, headers: {get() {return "100000000";}}});

    const entry = {filePath, version, token};

    return fileDownloader.download(entry)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Insufficient disk space');
        sinon.assert.notCalled(fileSystem.writeFileToDirectory);
      });
  });

});
