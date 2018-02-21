function createPlayerWindow() {
  // Center window on screen.
  const screenWidth = screen.availWidth;
  const screenHeight = screen.availHeight;
  const width = 600;
  const height = 500;

  chrome.app.window.create('player.html', {
    id: 'player',
    outerBounds: {
      width,
      height,
      left: Math.round((screenWidth - width) / 2), // eslint-disable-line no-magic-numbers
      top: Math.round((screenHeight - height) / 2) // eslint-disable-line no-magic-numbers
    }
  });
}

function init(launchData) {
  console.log(`Player launched with ${JSON.stringify(launchData)}`);
  createPlayerWindow();
}

chrome.app.runtime.onLaunched.addListener(init);
