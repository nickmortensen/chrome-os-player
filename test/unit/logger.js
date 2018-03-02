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

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

});
