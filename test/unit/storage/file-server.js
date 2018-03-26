/* eslint-disable no-magic-numbers */
const sinon = require('sinon');
const fileServer = require('../../../src/storage/file-server');

class TextEncoder {encode(string) {return string;}}
class TextDecoder {decode(buffer) {return buffer;}}

describe('File Server', () => {

  before(() => {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  });

  after(() => {
    Reflect.deleteProperty(global, 'TextEncoder');
    Reflect.deleteProperty(global, 'TextDecoder');
  })

  afterEach(() => chrome.flush());

  it('should create http server', () => {
    const serverSocketInfo = {socketId: 1, name: 'file-server'};
    chrome.sockets.tcpServer.getSockets.yields([]);
    chrome.sockets.tcpServer.create.yields(serverSocketInfo);

    return fileServer.init().then(() => {
      sinon.assert.calledWith(chrome.sockets.tcpServer.listen, serverSocketInfo.socketId, '127.0.0.1', 8989);
    });
  });

  it('should stop existing server sockets', () => {
    const serverSocketInfo = {socketId: 3, name: 'file-server'};
    chrome.sockets.tcpServer.close.yields();
    chrome.sockets.tcpServer.getSockets.yields([{socketId: 1, name: 'file-server'}, {socketId: 2, name: 'file-server'}]);
    chrome.sockets.tcpServer.create.yields(serverSocketInfo);

    return fileServer.init().then(() => {
      sinon.assert.calledWith(chrome.sockets.tcpServer.close, 1);
      sinon.assert.calledWith(chrome.sockets.tcpServer.close, 2);
    });
  });

  it('should accept socket connections', () => {
    const serverSocketInfo = {socketId: 1, name: 'file-server'};
    chrome.sockets.tcpServer.getSockets.yields([]);
    chrome.sockets.tcpServer.create.yields(serverSocketInfo);

    const acceptInfo = {socketId: serverSocketInfo.socketId, clientSocketId: 1};

    return fileServer.init().then(() => {

      chrome.sockets.tcpServer.onAccept.dispatch(acceptInfo);

      sinon.assert.calledWith(chrome.sockets.tcp.setPaused, acceptInfo.clientSocketId, false);
      sinon.assert.calledOnce(chrome.sockets.tcp.onReceive.addListener);
    });
  });

  it('should not accept socket connections from another server', () => {
    const serverSocketInfo = {socketId: 1, name: 'file-server'};
    chrome.sockets.tcpServer.getSockets.yields([]);
    chrome.sockets.tcpServer.create.yields(serverSocketInfo);

    const acceptInfo = {socketId: 99, clientSocketId: 1};

    return fileServer.init().then(() => {

      chrome.sockets.tcpServer.onAccept.dispatch(acceptInfo);

      sinon.assert.notCalled(chrome.sockets.tcp.setPaused);
      sinon.assert.notCalled(chrome.sockets.tcp.onReceive.addListener);
    });
  });

  it('should receive request', () => {
    const serverSocketInfo = {socketId: 1, name: 'file-server'};
    chrome.sockets.tcpServer.getSockets.yields([]);
    chrome.sockets.tcpServer.create.yields(serverSocketInfo);
    chrome.sockets.tcp.getInfo.yields({connected: true});
    chrome.sockets.tcp.setKeepAlive.yields();

    const acceptInfo = {socketId: 1, clientSocketId: 1};

    const receiveInfo = {data: 'GET http://localhost:8989/filePath ', socketId: 1};
    const keepAlive = false;

    return fileServer.init().then(() => {
      chrome.sockets.tcpServer.onAccept.dispatch(acceptInfo);
      chrome.sockets.tcp.onReceive.dispatch(receiveInfo);

      sinon.assert.calledWith(chrome.sockets.tcp.setKeepAlive, receiveInfo.socketId, keepAlive, 1);
      sinon.assert.calledOnce(chrome.sockets.tcp.send);
    });
  });

});
