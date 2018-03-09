const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../src/window-manager');
const logger = require('../../src/logging/logger');

const sandbox = sinon.createSandbox();

describe('background script', () => {

  before(() => global.chrome = chrome);

  beforeEach(() => {
    require('../../src/background'); // eslint-disable-line global-require
    sandbox.stub(logger, 'log');
  });

  afterEach(() => sandbox.restore());

  it('should launch player when app is launched', () => {
    sandbox.stub(windowManager, 'launchPlayer');
    chrome.storage.local.get.yields({});

    sinon.assert.calledOnce(chrome.app.runtime.onLaunched.addListener);

    chrome.app.runtime.onLaunched.dispatch({});

    sinon.assert.calledOnce(windowManager.launchPlayer);
  });

  it('should launch viewer when app is launched and there is a saved display id', () => {
    sandbox.stub(windowManager, 'launchViewer');

    const displayId = 'displayId';
    chrome.storage.local.get.yields({displayId});

    chrome.app.runtime.onLaunched.dispatch({});

    sinon.assert.calledWith(windowManager.launchViewer, displayId);
  });

  it('should close all windows when restart is required', () => {
    sandbox.stub(windowManager, 'closeAll');

    sinon.assert.calledOnce(chrome.runtime.onRestartRequired.addListener);

    chrome.runtime.onRestartRequired.dispatch();

    sinon.assert.calledOnce(windowManager.closeAll);
  });

  it('should request keep awake', () => {
    sinon.assert.calledWith(chrome.power.requestKeepAwake, 'display');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
