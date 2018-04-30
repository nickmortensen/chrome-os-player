const sinon = require('sinon');
const viewerMessaging = require('../../../../src/messaging/viewer-messaging');
const fileServer = require('../../../../src/storage/file-server');

const localMessaging = require('../../../../src/storage/messaging/local-messaging-helper');

const sandbox = sinon.createSandbox();

describe('Local Messaging Helper', () => {
  afterEach(() => sandbox.restore());

  it('should send file update message', () => {
    const fileUrl = 'http://127.0.0.1:8989/b75c2c519892788da48429f6b03836d606ed8e34';
    sandbox.stub(fileServer, 'getFileUrl').resolves(fileUrl);
    sandbox.stub(viewerMessaging, 'send');

    const filePath = 'local-storage-test/test-1x1.png';
    const metadata = {filePath, status: 'STALE', version: '1516908679637510'};

    return localMessaging.sendFileUpdate(metadata)
      .then(() => {
        const expectedMessage = {topic: 'FILE-UPDATE', from: 'local-messaging', ospath: fileUrl, filePath, status: metadata.status, version: metadata.version};
        sinon.assert.calledWith(viewerMessaging.send, expectedMessage);
      });

  });
});
