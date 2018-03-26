/* eslint-disable max-statements */
const sockets = new Set();
let serverSocketId = null;

function init() {
  return stopExisting().then(() => create());
}

function stopExisting() {
  return new Promise((resolve, reject) => {
    chrome.sockets.tcpServer.getSockets((existingSockets) => {
      const promises = existingSockets.filter(socket => socket.name === 'file-server').map(fileServer => {
        return new Promise((res) => chrome.sockets.tcpServer.close(fileServer.socketId, res));
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  });
}

function create(address = '127.0.0.1', port = 8989) { // eslint-disable-line no-magic-numbers
  chrome.sockets.tcpServer.create({name: 'file-server'}, (socketInfo) => {
    serverSocketId = socketInfo.socketId;
    chrome.sockets.tcpServer.onAccept.addListener(onAccept);
    chrome.sockets.tcpServer.onAcceptError.addListener(console.error);
    chrome.sockets.tcpServer.listen(socketInfo.socketId, address, port, (result) => {
      console.log(`socket server is listening on ${address}:${port}: ${result}`);
    });
  });
}

function onAccept(acceptInfo) {
  if (acceptInfo.socketId !== serverSocketId) {
    return;
  }

  sockets.add(acceptInfo.clientSocketId);

  chrome.sockets.tcp.setPaused(acceptInfo.clientSocketId, false);
  chrome.sockets.tcp.onReceive.addListener(onReceive);
}

function onReceive({data, socketId}) {
  if (!sockets.has(socketId)) {
    return;
  }

  const string = arrayBufferToString(data);
  console.log(`request received: ${string}`);
  if (string.indexOf('GET ') !== 0) {
    return destroySocketById(socketId);
  }

  const uri = parseUri(string);
  if (!uri) {
    return;
  }

  console.log(`read file from uri ${uri}`);
  const keepAlive = string.indexOf('Connection: keep-alive') > 0;
  writeSuccessResponse(socketId, uri, keepAlive);
}

function writeSuccessResponse(socketId, uri, keepAlive) {
  console.log('write success response', socketId, uri, keepAlive);

  const buffer = getResponseHeader(keepAlive);
  sendResponse(socketId, buffer, keepAlive);
}

function getResponseHeader(keepAlive) {
  const httpStatus = 'HTTP/1.0 200 OK';
  const contentType = 'text/plain';
  const contentLength = 0;
  const lines = [
    httpStatus,
    `Content-Length: ${contentLength}`,
    `Content-Type: ${contentType}`
  ];

  if (keepAlive) {
    lines.push('Connection: keep-alive');
  }

  return stringToArrayBuffer(lines.join('\n') + '\n\n'); // eslint-disable-line
}

function sendResponse(socketId, buffer, keepAlive) {
  // verify that socket is still connected before trying to send data
  chrome.sockets.tcp.getInfo(socketId, (socketInfo) => {
    if (!socketInfo.connected) {
      destroySocketById(socketId);
      return;
    }
    const delayInSeconds = 1;
    chrome.sockets.tcp.setKeepAlive(socketId, keepAlive, delayInSeconds, () => {
      if (chrome.runtime.lastError) {
        return destroySocketById(socketId);
      }

      chrome.sockets.tcp.send(socketId, buffer, (writeInfo) => {
        console.log('send', writeInfo);
        if (!keepAlive || chrome.runtime.lastError) {
          destroySocketById(socketId);
        }
      });
    });
  });
}

function destroySocketById(socketId) {
  chrome.sockets.tcp.disconnect(socketId, () => {
    if (chrome.runtime.lastError) {return;}
    chrome.sockets.tcp.close(socketId)
  });
}

function parseUri(data) {
  const uriStart = 'GET '.length;
  const uriEnd = data.indexOf(' ', uriStart);
  if (uriEnd < 0) {return;}

  const uri = data.substring(uriStart, uriEnd);
  const query = uri.indexOf("?");
  if (query > 0) {
    return uri.substring(0, query);
  }
  return uri;
}

function arrayBufferToString(buffer) {
  const decoder = new TextDecoder('utf8');
  return decoder.decode(buffer);
}

function stringToArrayBuffer(string) {
  const encoder = new TextEncoder('utf8');
  return encoder.encode(string);
}

module.exports = {
  init
}
