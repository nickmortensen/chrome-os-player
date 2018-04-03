const assert = require('assert');
const sinon = require('sinon');

const urlProvider = require('../../../src/storage/url-provider');

const sandbox = sinon.createSandbox();
const fetch = sandbox.stub();

const testToken = {
  hash: 'abc123',
  data: {
    displayId: 'test-display-id',
    timestamp: Date.now(),
    filePath: 'test-path'
  }
};

describe('URL Provider', () => {

  before(() => global.fetch = fetch);

  after(() => Reflect.deleteProperty(global, 'fetch'));

  afterEach(() => sandbox.restore());

  function testInvalidToken(token) {
    return urlProvider.getUrl(token)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Invalid token provided');
      });
  }

  it('should throw error when no token is provided', () => testInvalidToken());

  it('should throw error when no token hash provided', () => testInvalidToken({data: testToken.data}));

  it('should throw error when token data invalid', () => testInvalidToken({hash: "abc123", data: {}}));

  it('should return successful signed URL', () => {
    fetch.resolves({ok: true, status: 200, text() {return 'test-signed-url';}});

    return urlProvider.getUrl(testToken)
      .then(url => {
        assert.equal(url, 'test-signed-url');
      });
  });

  it('should return reject when response not OK', () => {
    fetch.resolves({ok: false, status: 503});

    return urlProvider.getUrl(testToken)
      .then(assert.fail)
      .catch(error => {
        assert.equal(error.message, 'Invalid response with status code 503');
      });
  });

});
