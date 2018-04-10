/* eslint-disable func-style, no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');

const fileDownloader = require('../../../src/storage/file-downloader');
const localMessaging = require('../../../src/storage/messaging/local-messaging-helper');
const db = require('../../../src/storage/db');
const logger = require('../../../src/logging/logger');

const queue = require('../../../src/storage/download-queue');

const sandbox = sinon.createSandbox();

describe('Download Queue', ()=>{

  beforeEach(() => {
    sandbox.stub(db.fileMetadata, 'getStale');
    sandbox.stub(fileDownloader, 'download').resolves();
    sandbox.stub(localMessaging, 'sendFileUpdate').resolves();
  });

  afterEach(() => sandbox.restore());

  it('downloads stale entry', ()=>{
    const staleEntry = {filePath: 'my-file'};
    db.fileMetadata.getStale.onFirstCall().returns([staleEntry]);
    db.fileMetadata.getStale.onSecondCall().returns([]);

    const executeImmediatly = () => {};
    return queue.checkStaleFiles(executeImmediatly)
      .then(() => {
        sinon.assert.calledWith(fileDownloader.download, staleEntry);
      });
  });

  it('downloads multiple stale entries one after the other', ()=>{
    const staleEntry = {filePath: 'my-file-0'};
    const secondStaleEntry = {filePath: 'my-file-1'};
    const thirdStaleEntry = {filePath: 'my-file-2'};
    db.fileMetadata.getStale.onFirstCall().returns([staleEntry]);
    db.fileMetadata.getStale.onSecondCall().returns([secondStaleEntry]);
    db.fileMetadata.getStale.onThirdCall().returns([thirdStaleEntry]);
    db.fileMetadata.getStale.onCall(3).returns([]);

    const executeImmediatly = () => {};
    return queue.checkStaleFiles(executeImmediatly)
      .then(() => {
        sinon.assert.calledThrice(fileDownloader.download);
        sinon.assert.calledWith(fileDownloader.download.lastCall, thirdStaleEntry);
      });
  });

  it('checks for stale files on interval if nothing was downloaded', ()=>{
    db.fileMetadata.getStale.returns([]);

    let callCount = 0;
    return queue.checkStaleFiles((cb) => {
      callCount += 1;
      if (callCount < 5) {return cb();}
    })
    .then(() => {
      assert.equal(callCount, 5);
    });
  });

  it('retries on interval after a download failure', ()=>{
    db.fileMetadata.getStale.returns([{filePath: 'my-file-0'}])
    fileDownloader.download.rejects();
    sandbox.stub(logger, 'error').resolves();

    let callCount = 0;
    return queue.checkStaleFiles((cb) => {
      callCount += 1;
      if (callCount < 5) {return cb();}
    })
    .then(()=>{
      assert.equal(callCount, 5);
      sinon.assert.callCount(logger.error, 5);
    });
  });

  it('sends file update message with stale status after downloading if version has changed', () => {
    const existingMetadata = {version: '1.0.1'};
    sandbox.stub(db.fileMetadata, 'get').returns(existingMetadata);

    db.fileMetadata.getStale.onFirstCall().returns([{filePath: 'my-file-0', version: '1.0.0'}]);
    db.fileMetadata.getStale.onSecondCall().returns([]);

    const executeImmediatly = () => {};
    return queue.checkStaleFiles(executeImmediatly)
      .then(() => {
        sinon.assert.calledOnce(localMessaging.sendFileUpdate);
        const metadata = localMessaging.sendFileUpdate.lastCall.args[0];
        assert.equal(metadata.status, 'STALE');
      });
  });

  it('sends file update message with current status after downloading if version has not changed', ()=>{
    const existingMetadata = {version: '1.0.0'};
    sandbox.stub(db.fileMetadata, 'get').returns(existingMetadata);

    db.fileMetadata.getStale.onFirstCall().returns([{filePath: 'my-file-0', version: '1.0.0'}]);
    db.fileMetadata.getStale.onSecondCall().returns([]);

    const executeImmediatly = () => {};
    return queue.checkStaleFiles(executeImmediatly)
      .then(() => {
        sinon.assert.calledOnce(localMessaging.sendFileUpdate);
        const metadata = localMessaging.sendFileUpdate.lastCall.args[0];
        assert.equal(metadata.status, 'CURRENT');
      });
  });

  it('sends file error message', ()=>{
    const existingMetadata = {version: '1.0.0'};
    sandbox.stub(db.fileMetadata, 'get').returns(existingMetadata);
    const error = new Error('Insuficient disk space');
    fileDownloader.download.rejects(error);
    sandbox.stub(logger, 'error').resolves();
    sandbox.stub(localMessaging, 'sendFileError').resolves();

    db.fileMetadata.getStale.onFirstCall().returns([{filePath: 'my-file-0', version: '1.0.0'}]);
    db.fileMetadata.getStale.onSecondCall().returns([]);

    const executeImmediatly = () => {};
    return queue.checkStaleFiles(executeImmediatly)
      .then(() => {
        sinon.assert.notCalled(localMessaging.sendFileUpdate);
        sinon.assert.calledWith(localMessaging.sendFileError, {filePath: 'my-file-0', version: '1.0.0', msg: error.message, details: error.stack});
      });
  });


});
