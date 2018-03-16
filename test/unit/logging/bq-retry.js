const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const bqClient = require('../../../src/logging/bq-client');

const bqRetry = require('../../../src/logging/bq-retry');

const sandbox = sinon.createSandbox();

describe('BQ Retry', () => {

  beforeEach(() => chrome.flush());

  afterEach(() => sandbox.restore());

  const eventName = 'test';
  const eventDetails = {details: 'some detail'};
  const data = {
    event: eventName,
    id: 'displayId',
    os: 'mac/x86-64',
    ip: '192.168.0.1',
    player_version: '0.0.0.0',
    event_details: JSON.stringify(eventDetails),
    chrome_version: '64.0.3282.186'
  };

  it('should log to big query', () => {

    sandbox.stub(bqClient, 'insert').resolves();

    return bqRetry.insert(data, 'ChromeOS_Player_Events', 'events')
      .then(() => {
        sinon.assert.calledWith(bqClient.insert, data, 'ChromeOS_Player_Events', 'events');
      });
  });

  it('should schedule retry', () => {

    sandbox.stub(bqClient, 'insert').rejects(Error('Testing'));

    chrome.storage.local.get.yields({});
    chrome.storage.local.set.yields();

    return bqRetry.insert(data, 'ChromeOS_Player_Events', 'events')
      .then(() => {
        sinon.assert.calledWith(chrome.alarms.create, 'bq-retry', {delayInMinutes: 10});
      });
  });

  it('should save failed log entry', () => {

    sandbox.stub(bqClient, 'insert').rejects(Error('Testing'));

    chrome.storage.local.get.yields({});
    chrome.storage.local.set.yields();

    const nowDate = new Date();

    const expectedFailedLogEntries = {
      'ChromeOS_Player_Events/events': [{data, ts: Number(nowDate)}]
    }

    return bqRetry.insert(data, 'ChromeOS_Player_Events', 'events', nowDate)
      .then(() => {
        sinon.assert.calledWith(chrome.storage.local.set, {failedLogEntries: expectedFailedLogEntries});
      });
  });

  it('should remove old entries', () => {

    sandbox.stub(bqClient, 'insert').rejects(Error('Testing'));

    const nowDate = new Date();
    const newEntryTimeStamp = Number(nowDate);
    const existingEntries = [...Array(50)].map((_, i) => {return {ts: newEntryTimeStamp - i * 10000000}}); // eslint-disable-line

    chrome.storage.local.get.yields({failedLogEntries: {'ChromeOS_Player_Events/events': existingEntries}});
    chrome.storage.local.set.yields();

    const expectedFailedLogEntries = {
      'ChromeOS_Player_Events/events': [...existingEntries.slice(0, existingEntries.length - 1).reverse(), {data, ts: newEntryTimeStamp}]
    }

    return bqRetry.insert(data, 'ChromeOS_Player_Events', 'events', nowDate)
      .then(() => {
        sinon.assert.calledWith(chrome.storage.local.set, {failedLogEntries: expectedFailedLogEntries});
      });
  });

  it('should insert failed entries', () => {
    sandbox.stub(bqClient, 'insertMultiple').resolves();

    const nowDate = new Date();
    const newEntryTimeStamp = Number(nowDate);
    const existingEntries = [...Array(5)].map((_, i) => ({ts: newEntryTimeStamp - i * 10000000})); // eslint-disable-line

    chrome.storage.local.get.yields({failedLogEntries: {'ChromeOS_Player_Events/events': existingEntries, 'Player_Data/configuration': [{}]}});
    chrome.storage.local.set.yields();

    return bqRetry.insertFailedLogEntries()
      .then(() => {
        sinon.assert.calledTwice(bqClient.insertMultiple);
        sinon.assert.calledWith(chrome.storage.local.set, {failedLogEntries: {}});
      });
  });

  it('should schedule a new retry when it fails inserting failed entries', () => {
    sandbox.stub(bqClient, 'insertMultiple').rejects(Error('Testing'));

    const nowDate = new Date();
    const newEntryTimeStamp = Number(nowDate);
    const existingEntries = [...Array(5)].map((_, i) => ({ts: newEntryTimeStamp - i * 10000000})); // eslint-disable-line

    const existingData = {failedLogEntries: {'ChromeOS_Player_Events/events': existingEntries, 'Player_Data/configuration': [{}]}};
    chrome.storage.local.get.yields(existingData);

    return bqRetry.insertFailedLogEntries()
      .then(() => {
        sinon.assert.calledWith(chrome.alarms.create, 'bq-retry');
        sinon.assert.notCalled(chrome.storage.local.set);
      });
  });

});
