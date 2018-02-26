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

module.exports = {
  launchPlayer
}
