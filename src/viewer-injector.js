/* eslint-disable max-statements */
function setUpMessaging() {
  const eventHandlers = {};
  let appWindow = null;
  let appOrigin = null;

  window.addEventListener('message', receiveMessage);

  function receiveMessage(event) {
    if (!appWindow || !appOrigin) {
      appWindow = event.source;
      appOrigin = event.origin;
    }
    if (!event.data) {
      return;
    }

    const message = event.data;
    console.log(`webview received message: ${JSON.stringify(message)}`);

    if (message.from === 'player') {
      handlePlayerMessage(message);
    } else {
      handleLocalMessagingMessage(message);
    }
  }

  function handlePlayerMessage(message) {
    const handlers = eventHandlers[message.topic];

    if (!handlers || !handlers.length) {return;}

    handlers.forEach(handler => handler(message));
  }

  function handleLocalMessagingMessage(message) {
    const handlers = eventHandlers['local-messaging'];
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => handler(message));
    }
  }

  function sendMessageToApp(message, origin = appOrigin) {
    if (!appWindow) {
      console.error('No initial message received');
      return;
    }
    console.log(`webview sending message to chrome app ${origin} ${JSON.stringify(message)}`);
    if (!message.from) {
      message.from = 'viewer';
    }

    appWindow.postMessage(message, origin)
  }

  function registerMessageHandler(eventName, handler) {
    console.log(`registering handler for event ${eventName}`);
    if (!eventHandlers[eventName]) {
      eventHandlers[eventName] = [];
    }

    eventHandlers[eventName].push(handler);
  }

  registerMessageHandler('renderer-ping', () => sendMessageToApp({message: 'renderer-pong'}));

  window.useWindowMessagingForLocalMessaging = true;
  window.disableViewerContentFetch = true;
  window.useRLSSingleFile = true;
  window.useRLSFolder = true;
  window.postToPlayer = sendMessageToApp;
  window.receiveFromPlayer = registerMessageHandler;
}

function generateScriptText(fn) {
  // Escape double-quotes.
  // Insert newlines correctly.
  const fnText = fn.toString()
    .replace(/"/g, '\\"')
    .replace(/(\r?\n|\r)/g, '\\n');

  const scriptText = `(function() {
      var script = document.createElement("script");
      script.textContent = "(function() { (${fnText})(); })()";
      (document.head || document.documentElement).appendChild(script);
      })()`;
  return scriptText;
}

module.exports = {
  generateMessagingSetupFunction() {
    return generateScriptText(setUpMessaging);
  }
}
