const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../src/window-manager');

const sandbox = sinon.createSandbox();

describe('Window Manager', () => {

  before(() => {
    global.chrome = chrome;
    global.screen = {availWidth: 1000, availHeight: 1000};
  });

  afterEach(() => {
    sandbox.restore();
    chrome.app.window.create.flush();
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

  it('should request keep awake when player is launched', () => {
    const playerWindow = {onClosed: {addListener() {}}};
    chrome.app.window.create.yields(playerWindow);

    windowManager.launchPlayer();

    assert(chrome.power.requestKeepAwake.calledWith('display'), 'chrome.power.requestKeepAwake should have been called');
  });

  it('should release keep awake when player is closed', () => {
    const playerWindow = {onClosed: {addListener() {}}};
    sandbox.stub(playerWindow.onClosed, 'addListener').yields([]);
    chrome.app.window.create.callsArgWith(2, playerWindow);

    windowManager.launchPlayer();

    assert(chrome.power.releaseKeepAwake.calledOnce, 'chrome.power.releaseKeepAwake should have been called');
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

  it('should close all windows', () => {
    const stub = {close: sandbox.spy()};
    const windows = [stub, stub, stub];
    chrome.app.window.getAll.returns(windows);

    windowManager.closeAll();

    sinon.assert.callCount(stub.close, windows.length);
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
    Reflect.deleteProperty(global, 'screen');
  });

});
