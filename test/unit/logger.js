const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const bq = require('../../src/bq-client');
const logger = require('../../src/logger');

const sandbox = sinon.createSandbox();

describe('Logger', () => {

  before(() => {
    global.chrome = chrome;
    global.navigator = {appVersion: '5.0 (X11; CrOS x86_64 10323.9.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.35 Safari/537.36'};
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should log to big query', () => {
    sinon.stub(bq, 'insert');

    chrome.storage.local.get.yields({displayId: 'displayId'});
    chrome.runtime.getPlatformInfo.yields({os: 'OS', arch: 'arch'});
    chrome.system.network.getNetworkInterfaces.yields([{address: 'ip'}]);
    chrome.runtime.getManifest.returns({name: 'Rise Player', version: 'version'});

    return logger.log('test', {details: 'some detail'}, bq)
      .then(() => {
        sinon.assert.calledOnce(bq.insert);
      });
  });

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
    Reflect.deleteProperty(global, 'navigator');
  });

});
