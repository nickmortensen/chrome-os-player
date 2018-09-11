const messaging = require('./messaging/messaging-service-client');
const logger = require('./logging/logger');

function captureScreenshot(webview) {
  return new Promise(resolve => webview.captureVisibleRegion(resolve));
}

function handleRequest(webview, request) {
  return captureScreenshot(webview)
    .then(dataUrl => fetch(dataUrl))
    .then(response => response.blob())
    .then(blob => {
      const options = {
        method: 'PUT',
        body: blob,
        headers: {
          'Cache-Control': 'public, max-age=0, no-cache, no-store',
          'Content-Type': ''
        }
      };
      return fetch(request.url, options);
    })
    .then(() => {
      messaging.send({
        msg: 'screenshot-saved',
        clientId: request.clientId
      });
      logger.log('screenshot uploaded and screenshot-saved message sent', request.clientId);
    })
    .catch(error => {
      messaging.send({
        msg: 'screenshot-failed',
        clientId: request.clientId
      });
      logger.error('player - error when uploading screenshot', error);
    });
}

module.exports = {
  handleRequest
};
