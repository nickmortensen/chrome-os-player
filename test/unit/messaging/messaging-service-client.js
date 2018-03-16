const sinon = require('sinon');

const Primus = require('../../../src/messaging/primus');

const messagingServiceClient = require('../../../src/messaging/messaging-service-client');

const sandbox = sinon.createSandbox();

describe('Messaging Service Client', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  it('should connect to messaging service', () => {
    const connection = {open() {}, on() {}};
    sandbox.stub(connection, 'open');
    sandbox.stub(Primus, 'connect').returns(connection);

    const displayId = 'displayId';
    const machineId = 'machineId';
    chrome.storage.local.get.yields({displayId, machineId});

    messagingServiceClient.init();

    const expectedMSUrl = `https://services.risevision.com/messaging/primus/?displayId=${displayId}&machineId=${machineId}`;
    const expectedPrimusOptions = {reconnect: {max: 1800000, min: 2000, retries: Infinity}, manual: true};

    sinon.assert.calledWith(Primus.connect, expectedMSUrl, expectedPrimusOptions);
    sinon.assert.calledOnce(connection.open);
  });

});
