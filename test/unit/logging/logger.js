const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const bq = require('../../../src/logging/bq-retry');
const systemInfo = require('../../../src/logging/system-info');
const environment = require('../../../src/launch-environment');

const logger = require('../../../src/logging/logger');

const sandbox = sinon.createSandbox();

describe('Logger', () => {

  after(() => chrome.flush());

  beforeEach(() => {
    sandbox.stub(bq, 'insert').resolves();

    sandbox.stub(environment, 'isDevelopmentVersion').returns(false);

    sandbox.stub(systemInfo, 'getId').returns('displayId');
    sandbox.stub(systemInfo, 'getMachineId').returns('machineId');
    sandbox.stub(systemInfo, 'getDisplayId').returns('displayId');
    sandbox.stub(systemInfo, 'getOS').returns('mac/x86-64');
    sandbox.stub(systemInfo, 'getChromeOSVersion').returns('10323.9.0');
    sandbox.stub(systemInfo, 'getIpAddress').returns('192.168.0.1');
    sandbox.stub(systemInfo, 'getPlayerVersion').returns('0.0.0.0');
    sandbox.stub(systemInfo, 'getPlayerName').returns('(Beta) RisePlayer');
    sandbox.stub(systemInfo, 'getChromeVersion').returns('64.0.3282.186');

  });

  afterEach(() => sandbox.restore());

  it('should log to big query', () => {
    const eventName = 'test';
    const eventDetails = {details: 'some detail'};
    const nowDate = new Date();

    const expetedData = {
      event: eventName,
      id: 'displayId',
      os: 'mac/x86-64',
      ip: '192.168.0.1',
      player_version: '0.0.0.0',
      event_details: JSON.stringify(eventDetails),
      chrome_version: '64.0.3282.186'
    };
    return logger.log(eventName, {details: 'some detail'}, nowDate)
      .then(() => {
        sinon.assert.calledWith(bq.insert, {ts: nowDate.toISOString(), ...expetedData}, 'ChromeOS_Player_Events', 'events');
      });
  });

  it('should not log to big query when on development environment', () => {
    environment.isDevelopmentVersion.returns(true);

    return logger.log('test')
      .then(() => {
        sinon.assert.notCalled(bq.insert);
      });
  });

  it('should log error to big query', () => {
    const eventName = 'Error on something';
    const error = Error('testing');
    const eventDetails = {message: error.message, stack: error.stack};

    const nowDate = new Date();

    const expetedData = {
      event: eventName,
      id: 'displayId',
      os: 'mac/x86-64',
      ip: '192.168.0.1',
      player_version: '0.0.0.0',
      event_details: JSON.stringify(eventDetails),
      chrome_version: '64.0.3282.186'
    };
    return logger.error(eventName, error, nowDate)
      .then(() => {
        sinon.assert.calledWith(bq.insert, {ts: nowDate.toISOString(), ...expetedData}, 'ChromeOS_Player_Events', 'events');
      });
  });

  it('should log client info to big query', () => {
    chrome.storage.local.get.yields({});

    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};
    const nowDate = new Date();

    const expectedPlayerData = {
      machine_id: 'machineId',
      display_id: 'displayId',
      os_description: 'Chrome OS 10323.9.0',
      player_name: '(Beta) RisePlayer',
      player_version: '0.0.0.0',
      browser_name: 'Chrome',
      browser_version: '64.0.3282.186',
      local_ip: '192.168.0.1',
      viewer_version: viewerConfig.viewerVersion,
      width: viewerConfig.width,
      height: viewerConfig.height
    };

    return logger.logClientInfo(viewerConfig, nowDate)
      .then(() => {
        sinon.assert.calledWith(bq.insert, {ts: nowDate.toISOString(), ...expectedPlayerData}, 'Player_Data', 'configuration');
        sinon.assert.calledWith(chrome.storage.local.set, {playerData: expectedPlayerData});
      });
  });

  it('should not log client info to big query when on development environment', () => {
    environment.isDevelopmentVersion.returns(true);

    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};

    return logger.logClientInfo(viewerConfig)
      .then(() => {
        sinon.assert.notCalled(bq.insert);
      });
  });

  it('should not log client info to big query when it is the same', () => {
    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};
    const nowDate = new Date();

    const expectedPlayerData = {
      display_id: 'displayId',
      machine_id: 'machineId',
      os_description: 'Chrome OS 10323.9.0',
      player_name: '(Beta) RisePlayer',
      player_version: '0.0.0.0',
      browser_name: 'Chrome',
      browser_version: '64.0.3282.186',
      local_ip: '192.168.0.1',
      viewer_version: viewerConfig.viewerVersion,
      width: viewerConfig.width,
      height: viewerConfig.height
    };

    chrome.storage.local.get.yields({playerData: expectedPlayerData});

    return logger.logClientInfo(viewerConfig, nowDate)
      .then(() => {
        sinon.assert.notCalled(bq.insert);
      });
  });

  it('should log client info to big query when it is updated', () => {
    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};
    const nowDate = new Date();

    const expectedPlayerData = {
      machine_id: 'machineId',
      display_id: 'displayId',
      os_description: 'Chrome OS 10323.9.0',
      player_name: '(Beta) RisePlayer',
      player_version: '0.0.0.0',
      browser_name: 'Chrome',
      browser_version: '64.0.3282.186',
      local_ip: '192.168.0.1',
      viewer_version: viewerConfig.viewerVersion,
      width: viewerConfig.width,
      height: viewerConfig.height
    };

    const staleData = {...expectedPlayerData, height: 900};
    chrome.storage.local.get.yields({playerData: staleData});

    return logger.logClientInfo(viewerConfig, nowDate)
      .then(() => {
        sinon.assert.calledWith(bq.insert, {...expectedPlayerData, ts: nowDate.toISOString()}, 'Player_Data', 'configuration');
        sinon.assert.calledWith(chrome.storage.local.set, {playerData: expectedPlayerData});
      });
  });

});
