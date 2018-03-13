const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const logger = require('../../src/logging/logger');

const messageHandler = require('../../src/viewer-message-handler');

const sandbox = sinon.createSandbox();

describe('Viewer Message Handler', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  it('should log client info when receives viewer-config', () => {

    sandbox.stub(logger, 'logClientInfo');

    const data = {from: 'viewer', message: 'viewer-config', width: 1080, height: 800, viewerVersion: '2-01-201711141519'};

    messageHandler.handleMessage(data);

    sinon.assert.calledWith(logger.logClientInfo, data);
  });

  it('should indicate viewer can receive content when it receives data-handler-registered', () => {
    const promise = messageHandler.viewerCanReceiveContent();

    const data = {from: 'viewer', message: 'data-handler-registered'};
    messageHandler.handleMessage(data);

    return promise;
  });

  it('should indicate viewer can receive content if it has already received data-handler-registered', () => {
    const data = {from: 'viewer', message: 'data-handler-registered'};
    messageHandler.handleMessage(data);

    return messageHandler.viewerCanReceiveContent();
  });

});
