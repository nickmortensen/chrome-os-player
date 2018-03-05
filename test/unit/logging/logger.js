const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const bq = require('../../../src/logging/bq-client');
const systemInfo = require('../../../src/logging/system-info');
const logger = require('../../../src/logging/logger');

const sandbox = sinon.createSandbox();

describe('Logger', () => {

  before(() => global.chrome = chrome);

  beforeEach(() => {
    sandbox.stub(bq, 'insert').returns(Promise.resolve());

    sandbox.stub(systemInfo, 'getId').returns('displayId');
    sandbox.stub(systemInfo, 'getMachineId').returns('machineId');
    sandbox.stub(systemInfo, 'getDisplayId').returns('displayId');
    sandbox.stub(systemInfo, 'getOS').returns('mac/x86-64');
    sandbox.stub(systemInfo, 'getIpAddress').returns('192.168.0.1');
    sandbox.stub(systemInfo, 'getPlayerVersion').returns('beta_0.0.0.0');
    sandbox.stub(systemInfo, 'getPlayerName').returns('(Beta) RisePlayerChromeOS');
    sandbox.stub(systemInfo, 'getChromeVersion').returns('64.0.3282.186');

  });

  afterEach(() => sandbox.restore());

  it('should log to big query', () => {
    return logger.log('test', {details: 'some detail'})
      .then(() => {
        sinon.assert.calledOnce(bq.insert);
      });
  });

  it('should log client info to big query', () => {
    chrome.storage.local.get.yields({});

    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};
    const nowDate = new Date();

    const expectedPlayerData = {
      machine_id: 'machineId',
      display_id: 'displayId',
      os_description: 'mac/x86-64',
      player_name: '(Beta) RisePlayerChromeOS',
      player_version: 'beta_0.0.0.0',
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

  it('should not log client info to big query when it is the same', () => {
    const viewerConfig = {width: 1000, height: 1000, viewerVersion: 'viewerVersion'};
    const nowDate = new Date();

    const expectedPlayerData = {
      machine_id: 'machineId',
      display_id: 'displayId',
      os_description: 'mac/x86-64',
      player_name: '(Beta) RisePlayerChromeOS',
      player_version: 'beta_0.0.0.0',
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
      os_description: 'mac/x86-64',
      player_name: '(Beta) RisePlayerChromeOS',
      player_version: 'beta_0.0.0.0',
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

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
