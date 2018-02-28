const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../src/window-manager');

const sandbox = sinon.createSandbox();

describe('background script', () => {

  before(() => global.chrome = chrome);

  afterEach(() => sandbox.restore());

  it('should create player window when app is launched', () => {
    sandbox.stub(windowManager, 'launchPlayer');

    require('../../src/background'); // eslint-disable-line global-require

    assert(chrome.app.runtime.onLaunched.addListener.calledOnce, 'chrome.app.runtime.onLaunched.addListener should have been called');

    chrome.app.runtime.onLaunched.dispatch({});

    assert(windowManager.launchPlayer.calledOnce, 'windowManager.launchPlayer should have been called');
  });

  it('should close all windows when restart is required', () => {
    sandbox.stub(windowManager, 'closeAll');

    require('../../src/background'); // eslint-disable-line global-require

    assert(chrome.runtime.onRestartRequired.addListener.calledOnce, 'chrome.runtime.onRestartRequired.addListener should have been called');

    chrome.runtime.onRestartRequired.dispatch();

    assert(windowManager.closeAll.calledOnce, 'windowManager.closeAll should have been called');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
