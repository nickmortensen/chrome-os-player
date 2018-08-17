const logger = require('../logging/logger');
const util = require('../util');

/* eslint-disable max-statements */
const address = '127.0.0.1'
const port = 9494;
const tcp = chrome.sockets.tcp;

module.exports = {
  init
}

function init() {
  chrome.sockets.tcpServer.create(socketInfo=>{
    chrome.sockets.tcpServer.onAccept.addListener(onAccept);
    chrome.sockets.tcpServer.onAcceptError.addListener(console.error);
    tcp.onReceive.addListener(onReceive);
    chrome.sockets.tcpServer.listen(socketInfo.socketId, address, port, result=>{
      logger.log(`display id server is listening on ${address}:${port}: ${result}`);
    });
  });
}

function onAccept(acceptInfo) {
  tcp.setPaused(acceptInfo.clientSocketId, false);
}

function onReceive({data, socketId}) {
  const requestText = util.arrayBufferToString(data);
  console.log(`request received:\n${requestText}`);

  const uri = util.parseUri(requestText);
  if (uri !== "/displays") {
    return sendResponse(socketId, '400 Bad Request');
  }

  return util.getDisplayId()
  .then(displayId=>sendResponse(socketId, '200 OK', JSON.stringify({displayId})))
  .catch(err=>logger.error('marketwall display id error', err))
}

function sendResponse(socketId, httpStatus = '', content = '') {
  const headers = [
    `HTTP/1.1 ${httpStatus}`,
    `Content-Type: application/json`,
    `Content-Length: ${content.length}`,
    'Transfer-Encoding: identity',
    'Connection: close'
  ];

  const headerText = headers.join('\r\n') + '\r\n\r\n'; // eslint-disable-line prefer-template

  if (httpStatus.includes("OK")) {logger.log('marketwall display id', content)}

  console.log(`sending response:\n${headerText + content}`); // eslint-disable-line prefer-template
  const responseBuffer = util.stringToArrayBuffer(headerText + content);

  tcp.send(socketId, responseBuffer, sendResult=>{
    console.log(`sent`, sendResult);

    if (chrome.runtime.lastError) {
      logger.error('marketwall display id error', Error(chrome.runtime.lastError));
    }

    tcp.disconnect(socketId, ()=>tcp.close(socketId))
  })
}
