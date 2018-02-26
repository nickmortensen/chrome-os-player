const assert = require('assert');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../src/window-manager');

describe('Window Manager', () => {

  before(() => {
    global.chrome = chrome;
    global.screen = {availWidth: 1000, availHeight: 1000};
  });

  it('should launch player', () => {
    const expectedWindowOptions = {
      id: 'player',
      outerBounds: {
        width: 900,
        height: 900,
        left: 50,
        top: 50
      }
    };

    windowManager.launchPlayer();

    assert(chrome.app.window.create.calledWith('player.html', expectedWindowOptions), 'chrome.app.window.create should have been called');
  });

  it('should launch viewer', () => {
    const innerBounds = {top: 0, left: 0, width: 400, height: 200}
    chrome.app.window.current.returns({innerBounds});

    const expectedWindowOptions = {id: 'viewer', state: 'fullscreen', innerBounds};

    const displayId = 'displayId';
    windowManager.launchViewer(displayId);

    assert(chrome.app.window.create.calledWith('webview.html', expectedWindowOptions), 'chrome.app.window.create should have been called');
  });

  it('should launch web view', () => {
    const innerBounds = {top: 0, left: 0, width: 400, height: 200}
    chrome.app.window.current.returns({innerBounds});

    const url = 'https://www.risevision.com/terms-service-privacy';
    windowManager.launchWebView(url);

    const expectedWindowOptions = {innerBounds};
    assert(chrome.app.window.create.calledWith('webview.html', expectedWindowOptions), 'chrome.app.window.create should have been called');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
    Reflect.deleteProperty(global, 'screen');
  });

});
