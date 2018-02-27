/* eslint-disable no-magic-numbers */

function launchPlayer() {
  // Center window on screen.
  const screenWidth = screen.availWidth;
  const screenHeight = screen.availHeight;
  const width = Math.round(screenWidth * 0.9);
  const height = Math.round(screenHeight * 0.9);

  chrome.app.window.create('player.html', {
    id: 'player',
    outerBounds: {
      width,
      height,
      left: Math.round((screenWidth - width) / 2),
      top: Math.round((screenHeight - height) / 2)
    }
  });
}

function launchViewer(displayId) {
  const url = `http://rvashow2.appspot.com/Viewer.html?player=true&type=display&id=${displayId}`;
  createWebViewWindow(url, {id: 'viewer', state: 'fullscreen'});
}

function launchWebView(url) {
  createWebViewWindow(url);
}

function createWebViewWindow(url, options = {}) {
  const {top, left, height, width} = chrome.app.window.current().innerBounds;
  const defaultOptions = {innerBounds: {top, left, height, width}};
  chrome.app.window.create('webview.html', Object.assign(defaultOptions, options), (appWin) => {
    appWin.contentWindow.addEventListener('DOMContentLoaded', () => {
      const webview = appWin.contentWindow.document.querySelector('webview');
      webview.src = url;
    });
  });
}

module.exports = {
  launchPlayer,
  launchViewer,
  launchWebView
}
