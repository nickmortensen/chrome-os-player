/* eslint-disable no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');

const fileSystem = require('../../../src/storage/file-system');

const sandbox = sinon.createSandbox();
const window = {webkitRequestFileSystem() {}, PERSISTENT: 1};
const navigator = {webkitPersistentStorage: {queryUsageAndQuota() {}}};
function WritableStream() {}

describe('File System', () => {

  before(() => {
    global.window = window;
    global.navigator = navigator;
    global.WritableStream = WritableStream;
  });

  after(() => {
    Reflect.deleteProperty(global, 'window');
    Reflect.deleteProperty(global, 'navigator');
    Reflect.deleteProperty(global, 'WritableStream');
  });

  afterEach(() => sandbox.restore());

  it('should create directory', () => {
    const expectedDir = {};

    const fs = {root: {getDirectory() {}}};
    sandbox.stub(fs.root, 'getDirectory').yields(expectedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);

    const name = 'download';

    return fileSystem.createDirectory(name).then((dir) => {
      assert.equal(dir, expectedDir);
    });
  });

  it('should return available space', () => {
    const grantedBytes = 50 * 1024 * 1024;
    const usedBytes = 5 * 1024 * 1024;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota').yields(usedBytes, grantedBytes);

    return fileSystem.getAvailableSpace().then((spaceLeft) => {
      assert.equal(spaceLeft, grantedBytes - usedBytes);
    });
  });

  it('should check for available space', () => {
    const grantedBytes = 50 * 1024 * 1024;
    const usedBytes = 5 * 1024 * 1024;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota').yields(usedBytes, grantedBytes);

    const fileSize = 1 * 1024 * 1024;

    return fileSystem.checkAvailableDiskSpace(fileSize).then((isAvailable) => {
      assert.equal(isAvailable, true);
    });
  });

  it('should check for available space when file size exceeds free space', () => {
    const grantedBytes = 50 * 1024 * 1024;
    const usedBytes = 5 * 1024 * 1024;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota').yields(usedBytes, grantedBytes);

    const fileSize = 46 * 1024 * 1024;

    return fileSystem.checkAvailableDiskSpace(fileSize).then((isAvailable) => {
      assert.equal(isAvailable, false);
    });
  });

  it('should write file to directory', () => {
    const expectedFile = {createWriter() {}};
    sandbox.stub(expectedFile, 'createWriter').yields({});

    const mockedDir = {getFile() {}};
    const fs = {root: {getDirectory() {}}};
    sandbox.stub(mockedDir, 'getFile').yields(expectedFile);
    sandbox.stub(fs.root, 'getDirectory').yields(mockedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);

    const fileName = 'local-storage-test/test-1x1.png';
    const contentStream = {pipeTo() {return Promise.resolve()}};
    const dirName = 'download';

    return fileSystem.writeFileToDirectory(fileName, contentStream, dirName).then(fileEntry => {
      assert.equal(fileEntry, expectedFile);
    });
  });

});
