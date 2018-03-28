const util = require('./util');
const fileSystem = require('./file-system');

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
    chrome.sockets.tcp.onReceive.addListener(onReceive);
    chrome.sockets.tcpServer.listen(socketInfo.socketId, address, port, (result) => {
      console.log(`http server is listening on ${address}:${port}: ${result}`);
    });
  });
}

function onAccept(acceptInfo) {
  if (acceptInfo.socketId !== serverSocketId) {
    return;
  }

  sockets.add(acceptInfo.clientSocketId);
  chrome.sockets.tcp.setPaused(acceptInfo.clientSocketId, false);
}

function onReceive({data, socketId}) {
  if (!sockets.has(socketId)) {return;}

  const string = util.arrayBufferToString(data);
  console.log(`request received: ${string}`);
  const keepAlive = string.indexOf('Connection: keep-alive') > 0;
  const uri = util.parseUri(string);
  if (!uri) {
    return sendResponse(socketId, '400 Bad Request', keepAlive);
  }

  console.log(`read file from uri ${uri}`);
  const fileName = uri.slice(uri.indexOf('/') + 1);
  fileSystem.readFile(fileName, 'cache')
    .then(file => sendResponse(socketId, '200 OK', keepAlive, file))
    .catch(() => sendResponse(socketId, '404 Not Found', keepAlive));
}

function sendResponse(socketId, httpStatus, keepAlive, file) {
  const headerBuffer = createResponseHeader(httpStatus, keepAlive, file);
  if (!file) {
    return sendBuffer(socketId, headerBuffer, keepAlive);
  }

  const outputBuffer = new ArrayBuffer(headerBuffer.byteLength + file.size);
  const view = new Uint8Array(outputBuffer);
  view.set(headerBuffer, 0);

  fileSystem.readFileAsArrayBuffer(file)
    .then((fileBuffer) => {
      view.set(new Uint8Array(fileBuffer), headerBuffer.byteLength);
      sendBuffer(socketId, outputBuffer, keepAlive);
    })
    .catch(() => sendResponse(socketId, '404 Not Found', keepAlive));
}

function sendBuffer(socketId, buffer, keepAlive) {
  // verify that socket is still connected before trying to send data
  chrome.sockets.tcp.getInfo(socketId, (socketInfo) => {
    if (!socketInfo.connected) {
      return destroySocketById(socketId);
    }
    chrome.sockets.tcp.setKeepAlive(socketId, keepAlive, () => {
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

function createResponseHeader(httpStatus, keepAlive, file) {
  const contentType = file ? file.type : 'text/plain';
  const contentLength = file ? file.size : 0;
  const lines = [
    `HTTP/1.0 ${httpStatus}`,
    `Content-Length: ${contentLength}`,
    `Content-Type: ${contentType}`
  ];

  if (keepAlive) {
    lines.push('Connection: keep-alive');
  }

  const responseText = lines.join('\n') + '\n\n'; // eslint-disable-line
  console.log(`sending response: ${responseText}`)
  return util.stringToArrayBuffer(responseText);
}

function destroySocketById(socketId) {
  sockets.delete(socketId);

  chrome.sockets.tcp.getInfo(socketId, (socketInfo) => {
    if (socketInfo.connected) {
      chrome.sockets.tcp.disconnect(socketId, () => chrome.sockets.tcp.close(socketId));
    } else {
      chrome.sockets.tcp.close(socketId);
    }
  });
}

module.exports = {
  init
}
