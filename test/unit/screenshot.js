const sinon = require('sinon');
const messaging = require('../../src/messaging/messaging-service-client');
const logger = require('../../src/logging/logger');

const screenshot = require('../../src/screenshot');

const sandbox = sinon.createSandbox();
const fetch = sandbox.stub();
const webview = {captureVisibleRegion() {}};

describe('Screenshot', () => {

  before(() => global.fetch = fetch);

  after(() => Reflect.deleteProperty(global, 'fetch'));

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(logger, 'log');
    sandbox.stub(logger, 'error');
    sandbox.stub(messaging, 'send');
    sandbox.stub(webview, 'captureVisibleRegion').yields('dataUrl');
    fetch.reset();
  });

  it('should capture webview visible region', () => {
    const request = {url: 'uploadUrl', clientId: 'clientId'};

    fetch.onFirstCall().resolves({blob() {return Promise.resolve({})}});
    fetch.onSecondCall().resolves();

    return screenshot.handleRequest(webview, request).then(() => {
      sinon.assert.calledOnce(webview.captureVisibleRegion);
    });
  });

  it('should upload to request url', () => {
    const request = {url: 'uploadUrl', clientId: 'clientId'};

    fetch.onFirstCall().resolves({blob() {return Promise.resolve({})}});
    fetch.onSecondCall().resolves();

    return screenshot.handleRequest(webview, request).then(() => {
      sinon.assert.calledWith(fetch, request.url);
    });
  });

  it('should send "screenshot-saved" message on success', () => {
    const request = {url: 'uploadUrl', clientId: 'clientId'};

    fetch.onFirstCall().resolves({blob() {return Promise.resolve({})}});
    fetch.onSecondCall().resolves();

    return screenshot.handleRequest(webview, request).then(() => {
      sinon.assert.calledWith(messaging.send, {msg: 'screenshot-saved', clientId: request.clientId});
    });
  });

  it('should send "screenshot-failed" message on error', () => {
    const request = {url: 'uploadUrl', clientId: 'clientId'};

    fetch.onFirstCall().resolves({blob() {return Promise.resolve({})}});
    fetch.onSecondCall().rejects();

    return screenshot.handleRequest(webview, request).then(() => {
      sinon.assert.calledWith(messaging.send, {msg: 'screenshot-failed', clientId: request.clientId});
    });
  });

});
