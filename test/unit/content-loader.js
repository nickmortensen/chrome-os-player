const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const gcsClient = require('../../src/gcs-client');

const contentLoader = require('../../src/content-loader');

const sandbox = sinon.createSandbox();

describe('Content Loader', () => {

  before(() => global.chrome = chrome);

  after(() => {
    chrome.flush();
    Reflect.deleteProperty(global, 'chrome');
  });

  afterEach(() => sandbox.restore());

  it('should fetch content from GCS', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    sandbox.stub(gcsClient, 'fetchJson').returns(Promise.resolve());

    return contentLoader.fetchContent().then(() => {
      sinon.assert.calledWith(gcsClient.fetchJson, 'risevision-display-notifications', 'displayId/content.json');
    });
  });

});
