const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const bq = require('../../src/bq-client');
const systemInfo = require('../../src/system-info');
const logger = require('../../src/logger');

const sandbox = sinon.createSandbox();

describe('Logger', () => {

  before(() => global.chrome = chrome);

  afterEach(() => sandbox.restore());

  it('should log to big query', () => {
    sandbox.stub(bq, 'insert');

    sandbox.stub(systemInfo, 'getId').returns('displayId');
    sandbox.stub(systemInfo, 'getOS').returns('mac/x86-64');
    sandbox.stub(systemInfo, 'getIpAddress').returns('192.168.0.1');
    sandbox.stub(systemInfo, 'getPlayerVersion').returns('beta_0.0.0.0');
    sandbox.stub(systemInfo, 'getChromeVersion').returns('64.0.3282.186');

    return logger.log('test', {details: 'some detail'})
      .then(() => {
        sinon.assert.calledOnce(bq.insert);
      });
  });

  it('should log client info to big query', () => {
    sandbox.stub(bq, 'insert');

    sandbox.stub(systemInfo, 'getMachineId').returns('machineId');
    sandbox.stub(systemInfo, 'getDisplayId').returns('displayId');
    sandbox.stub(systemInfo, 'getOS').returns('mac/x86-64');
    sandbox.stub(systemInfo, 'getIpAddress').returns('192.168.0.1');
    sandbox.stub(systemInfo, 'getPlayerName').returns('(Beta) RisePlayerChromeOS');
    sandbox.stub(systemInfo, 'getPlayerVersion').returns('beta_0.0.0.0');
    sandbox.stub(systemInfo, 'getChromeVersion').returns('64.0.3282.186');

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
      height: viewerConfig.height,
      ts: nowDate.toISOString()
    };

    return logger.logClientInfo(viewerConfig, nowDate)
      .then(() => {
        sinon.assert.calledWith(bq.insert, expectedPlayerData, 'Player_Data', 'configuration');
      });
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
