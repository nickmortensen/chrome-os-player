const util = require('./util');

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
  chrome.sockets.tcp.onReceive.addListener(onReceive);
}

function onReceive({data, socketId}) {
  if (!sockets.has(socketId)) {return;}

  const string = util.arrayBufferToString(data);
  console.log(`request received: ${string}`);

  const uri = util.parseUri(string);
  console.log(`read file from uri ${uri}`);
  const keepAlive = string.indexOf('Connection: keep-alive') > 0;
  const buffer = getResponseHeader(uri, keepAlive);
  sendResponse(socketId, buffer, keepAlive);
}

function getResponseHeader(uri, keepAlive) {
  const httpStatus = uri ? '200 OK' : '400 Bad Request';
  const contentType = 'text/plain';
  const contentLength = 0;
  const lines = [
    `HTTP/1.0 ${httpStatus}`,
    `Content-Length: ${contentLength}`,
    `Content-Type: ${contentType}`
  ];

  if (keepAlive) {
    lines.push('Connection: keep-alive');
  }

  return util.stringToArrayBuffer(lines.join('\n') + '\n\n'); // eslint-disable-line
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

module.exports = {
  init
}
