const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const logger = require('../../src/logging/logger');
const gcsClient = require('../../src/gcs-client');

const messageHandler = require('../../src/viewer-message-handler');

const sandbox = sinon.createSandbox();

describe('Viewer Message Handler', () => {

  before(() => global.chrome = chrome);

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

  afterEach(() => sandbox.restore());

  it('should log client info when receives viewer-config', () => {

    sandbox.stub(logger, 'logClientInfo');

    const data = {from: 'viewer', message: 'viewer-config', width: 1080, height: 800, viewerVersion: '2-01-201711141519'};

    messageHandler.handleMessage(data);

    sinon.assert.calledWith(logger.logClientInfo, data);
  });

  it('should fetch content data when receives data-handler-registered', () => {

    sandbox.stub(gcsClient, 'fetchJson').returns(Promise.resolve());

    chrome.storage.local.get.yields({displayId: 'displayId'});

    const data = {from: 'viewer', message: 'data-handler-registered'};

    messageHandler.handleMessage(data);

    sinon.assert.calledWith(gcsClient.fetchJson, 'risevision-display-notifications', 'displayId/content.json');
  });

});
