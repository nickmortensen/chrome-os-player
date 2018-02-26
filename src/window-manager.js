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
  const url = `http://rvashow.appspot.com/Viewer.html?player=true&type=display&id=${displayId}`;
  chrome.app.window.create('webview.html', {id: 'viewer', hidden: true}, (appWin) => {
      appWin.contentWindow.addEventListener('DOMContentLoaded', () => {
        const webview = appWin.contentWindow.document.querySelector('webview');
        webview.src = url;
        appWin.fullscreen();
      });
  });
}

module.exports = {
  launchPlayer,
  launchViewer
}
