const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../src/window-manager');

const sandbox = sinon.createSandbox();

describe('background script', () => {

  before(() => global.chrome = chrome);

  beforeEach(() => require('../../src/background')); // eslint-disable-line global-require
  afterEach(() => sandbox.restore());

  it('should launch player when app is launched', () => {
    sandbox.stub(windowManager, 'launchPlayer');
    chrome.storage.local.get.yields({});

    assert(chrome.app.runtime.onLaunched.addListener.calledOnce, 'chrome.app.runtime.onLaunched.addListener should have been called');

    chrome.app.runtime.onLaunched.dispatch({});

    assert(windowManager.launchPlayer.calledOnce, 'windowManager.launchPlayer should have been called');
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

    assert(chrome.runtime.onRestartRequired.addListener.calledOnce, 'chrome.runtime.onRestartRequired.addListener should have been called');

    chrome.runtime.onRestartRequired.dispatch();

    assert(windowManager.closeAll.calledOnce, 'windowManager.closeAll should have been called');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
