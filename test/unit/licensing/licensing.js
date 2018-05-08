const sinon = require('sinon');
const viewerMessaging = require('../../../src/messaging/viewer-messaging');

const licensing = require('../../../src/licensing/licensing');

const sandbox = sinon.createSandbox();

describe('Licensing', () => {

  afterEach(() => sandbox.restore());

  it('should respond storage-licensing-request with always authorized', () => {
    sandbox.stub(viewerMessaging, 'on');
    sandbox.stub(viewerMessaging, 'send');

    viewerMessaging.on.withArgs('storage-licensing-request').yields();

    licensing.init();

    const expectedMessage = {from: 'local-messaging', topic: 'storage-licensing-update', isAuthorized: true};
    sinon.assert.calledWith(viewerMessaging.send, expectedMessage);
  });

});
