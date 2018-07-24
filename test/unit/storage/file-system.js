/* eslint-disable no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');
const logger = require('../../../src/logging/logger');

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

  beforeEach(() => sandbox.stub(logger, 'log'));

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

  it('should move file to directory', () => {
    const fileEntryToMove = {moveTo() {}};
    sandbox.stub(fileEntryToMove, 'moveTo').yields(fileEntryToMove);

    const mockedDir = {getFile() {}};
    const fs = {root: {getDirectory() {}}};
    sandbox.stub(fs.root, 'getDirectory').yields(mockedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);

    const dirName = 'files';

    return fileSystem.moveFileToDirectory(fileEntryToMove, dirName).then(fileEntry => {
      assert.equal(fileEntry, fileEntryToMove);
    });
  });

  it('should read file', () => {
    const mockedFile = {name: 'logo.png', size: 100};
    const fileEntry = {file() {}};
    sandbox.stub(fileEntry, 'file').yields(mockedFile);

    const mockedDir = {getFile() {}};
    sandbox.stub(mockedDir, 'getFile').yields(fileEntry);

    const fs = {root: {getDirectory() {}}};
    sandbox.stub(fs.root, 'getDirectory').yields(mockedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);

    const fileName = 'logo.png'
    const dirName = 'cache';

    return fileSystem.readFile(fileName, dirName).then(file => {
      assert.equal(file, mockedFile);
    });
  });

  it("should not clear cache if available space has not reached the threshold", () => {
    const grantedBytes = 50 * 1024 * 1024;
    const usedBytes = 5 * 1024 * 1024;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota').yields(usedBytes, grantedBytes);

    const mockedFile = mockFile('logo.png', new Date());

    const entries = [mockedFile];
    mockDir(entries);

    const dirName = 'cache';
    return fileSystem.clearLeastRecentlyUsedFiles(dirName).then(() => {
      sinon.assert.notCalled(mockedFile.remove);
    });
  });

  it("should not delete anything from cache if there is no file to be deleted", () => {
    const grantedBytes = 50 * 1024 * 1024;
    const usedBytes = grantedBytes * 0.91;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota').yields(usedBytes, grantedBytes);

    const mockedFile = mockFile('logo.png', new Date());

    const entries = [];
    mockDir(entries);

    const dirName = 'cache';
    return fileSystem.clearLeastRecentlyUsedFiles(dirName).then(() => {
      sinon.assert.notCalled(mockedFile.remove);
    });
  });

  it("should delete least recently used file from cache until available space is smaller than threshold", () => {
    const grantedBytes = 50 * 1024 * 1024;

    sandbox.stub(navigator.webkitPersistentStorage, 'queryUsageAndQuota')
      .onFirstCall().yields(grantedBytes * 0.91, grantedBytes)
      .onSecondCall().yields(grantedBytes * 0.8, grantedBytes);

    const now = new Date();

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(now.getHours() - 1);

    const mostRecent = mockFile('most-recent', now);
    const oldest = mockFile('oldest', oneYearAgo);
    const lastMonth = mockFile('last-month', oneMonthAgo);
    const lastHour = mockFile('last-hour', oneHourAgo);

    const entries = [mostRecent, oldest, lastMonth, lastHour];
    mockDir(entries);

    const dirName = 'cache';
    return fileSystem.clearLeastRecentlyUsedFiles(dirName).then(() => {
      sinon.assert.called(oldest.remove);
      sinon.assert.notCalled(mostRecent.remove);
      sinon.assert.notCalled(lastMonth.remove);
      sinon.assert.notCalled(lastHour.remove);
    });
  });

  it("should remove cache file by name", () => {
    const fileName = 'f4fc70185c74a262524c67f43e92a9bd681a72ac';
    const mockedFile = mockFile(fileName, new Date());

    const mockedDir = {getFile() {}};
    sandbox.stub(mockedDir, 'getFile').yields(mockedFile);

    const fs = {root: {getDirectory() {}}};
    sandbox.stub(fs.root, 'getDirectory').yields(mockedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);

    return fileSystem.removeCacheFile(fileName).then(() => {
      sinon.assert.called(mockedFile.remove);
    });
  });

  function mockFile(name, modificationTime) {
    const mockedFile = {name, isFile: true, getMetadata() {}, remove() {}};
    sandbox.stub(mockedFile, 'getMetadata').yields({modificationTime});
    sandbox.stub(mockedFile, 'remove').yields();
    return mockedFile;
  }

  function mockDir(entries) {
    const mockedDirReader = {readEntries() {}};
    sandbox.stub(mockedDirReader, "readEntries")
      .onFirstCall().yields(entries)
      .onSecondCall().yields([]);
    const mockedDir = {createReader() {}};
    sandbox.stub(mockedDir, 'createReader').returns(mockedDirReader);

    const fs = {root: {getDirectory() {}}};
    sandbox.stub(fs.root, 'getDirectory').yields(mockedDir);
    sandbox.stub(window, 'webkitRequestFileSystem').yields(fs);
  }
});
