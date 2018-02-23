const assert = require('assert');
const chrome = require('sinon-chrome/apps');

describe('background script', () => {

  before(() => {
    global.chrome = chrome;
    global.screen = {availWidth: 1000, availHeight: 1000};
  });

  it('should create player window when app is launched', () => {
    require('../../src/background'); // eslint-disable-line global-require

    assert(chrome.app.runtime.onLaunched.addListener.calledOnce, 'chrome.app.runtime.onLaunched.addListener should have been called');

    chrome.app.runtime.onLaunched.dispatch({})

    const expectedWindowOptions = {
      id: 'player',
      outerBounds: {
        width: 900,
        height: 900,
        left: 50,
        top: 50
      }
    };

    assert(chrome.app.window.create.calledWith('player.html', expectedWindowOptions), 'chrome.app.window.create should have been called');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
    Reflect.deleteProperty(global, 'screen');
  });

});
