const sinon = require('sinon');

const logger = require('../../../src/logging/logger');
const Primus = require('../../../src/messaging/primus');

const messagingServiceClient = require('../../../src/messaging/messaging-service-client');

const sandbox = sinon.createSandbox();
const connection = {open() {}, on() {}};

describe('Messaging Service Client', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(logger, 'log');

    sandbox.stub(connection, 'open');
    sandbox.stub(Primus, 'connect').returns(connection);

    const displayId = 'displayId';
    const machineId = 'machineId';
    chrome.storage.local.get.yields({displayId, machineId});
  });

  it('should connect to messaging service', () => {
    sandbox.stub(connection, 'on').withArgs('open').yields();

    const expectedMSUrl = 'https://services.risevision.com/messaging/primus/?displayId=displayId&machineId=machineId';
    const expectedPrimusOptions = {reconnect: {max: 1800000, min: 2000, retries: Infinity}, manual: true};

    return messagingServiceClient.init().then(() => {
      sinon.assert.calledWith(Primus.connect, expectedMSUrl, expectedPrimusOptions);
      sinon.assert.calledOnce(connection.open);
    });
  });

  it('should log connection opened event', () => {
    sandbox.stub(connection, 'on').withArgs('open').yields();

    const event = 'MS connection opened';

    return messagingServiceClient.init().then(() => {
      sinon.assert.calledWith(logger.log, event);
    });
  });

  it('should log connection error event', () => {
    sandbox.stub(logger, 'error');

    const error = Error('testing');
    sandbox.stub(connection, 'on').withArgs('error').yields(error);

    const event = 'MS connection error';

    return messagingServiceClient.init().catch(() => {
      sinon.assert.calledWith(logger.error, event, error);
    });
  });

  it('should invoke handlers when message is received', () => {
    const on = sandbox.stub(connection, 'on');
    on.withArgs('open').yields();

    const message = {filePath: 'path', version: 'version', type: 'ADD', topic: 'MSFILEUPDATE'};
    on.withArgs('data').yields(message);

    const handler = sandbox.spy();
    messagingServiceClient.on('MSFILEUPDATE', handler);
    return messagingServiceClient.init().then(() => {
      sinon.assert.calledWith(handler, message);
    });
  });

  it('should invoke handlers when message is received as string', () => {
    const on = sandbox.stub(connection, 'on');
    on.withArgs('open').yields();

    const message = 'screenshot-request';
    on.withArgs('data').yields(message);

    const handler = sandbox.spy();
    messagingServiceClient.on('screenshot-request', handler);
    return messagingServiceClient.init().then(() => {
      sinon.assert.calledWith(handler, message);
    });
  });


  it('should not invoke handlers when message is not a string and has no topic', () => {
    const on = sandbox.stub(connection, 'on');
    on.withArgs('open').yields();

    const message = {};
    on.withArgs('data').yields(message);

    const handler = sandbox.spy();
    messagingServiceClient.on('screenshot-request', handler);
    return messagingServiceClient.init().then(() => {
      sinon.assert.notCalled(handler);
    });
  });


});
