const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const systemInfo = require('../../src/system-info');

const sandbox = sinon.createSandbox();

describe('System Info', () => {

  before(() => global.chrome = chrome);

  afterEach(() => sandbox.restore());

  it('should return display id', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});

    return systemInfo.getId()
      .then((id) => {
        assert(id === 'displayId');
      });
  });

  it('should return machine id when there is no saved display id', () => {
    chrome.storage.local.get.yields({machineId: 'machineId'});

    return systemInfo.getId()
      .then((id) => {
        assert(id === '0.machineId');
      });
  });

  it('should return OS', () => {
    chrome.runtime.getPlatformInfo.yields({os: 'OS', arch: 'arch'});

    return systemInfo.getOS()
      .then((os) => {
        assert(os === 'OS/arch');
      });
  });

  it('should return list of ip addresses', () => {
    chrome.system.network.getNetworkInterfaces.yields([{address: 'ip'}, {address: 'ip2'}, {address: 'ip3'}]);

    return systemInfo.getIpAddress()
      .then((os) => {
        assert(os === 'ip,ip2,ip3');
      });
  });

  it('should return player version', () => {
    chrome.runtime.getManifest.returns({name: 'Rise Player', version: 'version'});

    const playerVersion = systemInfo.getPlayerVersion();

    assert(playerVersion === 'version');
  });

  it('should return player beta version', () => {
    chrome.runtime.getManifest.returns({name: 'Rise Player Beta', version: 'version'});

    const playerVersion = systemInfo.getPlayerVersion();

    assert(playerVersion === 'beta_version');
  });

  it('should return Chrome version', () => {
    global.navigator = {appVersion: '5.0 (X11; CrOS x86_64 10323.9.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.35 Safari/537.36'};

    const chromeVersion = systemInfo.getChromeVersion();

    assert(chromeVersion === '65.0.3325.35');

    Reflect.deleteProperty(global, 'navigator');
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
