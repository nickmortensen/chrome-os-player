/* eslint-disable no-magic-numbers */

function launchPlayer() {
  const options = {
    id: 'player',
    outerBounds: getDefaultScreenBounds()
  };

  chrome.app.window.create('player.html', options, (playerWindow) => {
    chrome.power.requestKeepAwake('display');
    playerWindow.onClosed.addListener(() => chrome.power.releaseKeepAwake());
  });
}

function launchViewer(displayId) {
  const url = `http://rvashow2.appspot.com/Viewer.html?player=true&type=display&id=${displayId}`;
  createWebViewWindow(url, {id: 'viewer', state: 'fullscreen'});
}

function launchWebView(url) {
  createWebViewWindow(url);
}

function closeAll() {
  const windows = chrome.app.window.getAll();
  windows.forEach(win => win.close());
}

function createWebViewWindow(url, options = {}) {
  const defaultOptions = {outerBounds: getDefaultScreenBounds()};
  chrome.app.window.create('webview.html', Object.assign(defaultOptions, options), (appWin) => {
    appWin.contentWindow.addEventListener('DOMContentLoaded', () => {
      const webview = appWin.contentWindow.document.querySelector('webview');
      webview.src = url;
    });
  });
}

function getDefaultScreenBounds() {
  // Center window on screen.
  const screenWidth = screen.availWidth;
  const screenHeight = screen.availHeight;
  const width = Math.round(screenWidth * 0.9);
  const height = Math.round(screenHeight * 0.9);
  return {
    width,
    height,
    left: Math.round((screenWidth - width) / 2),
    top: Math.round((screenHeight - height) / 2)
  };
}

module.exports = {
  launchPlayer,
  launchViewer,
  launchWebView,
  closeAll
}
