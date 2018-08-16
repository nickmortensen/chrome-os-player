const assert = require('assert');
const sinon = require('sinon');

const util = require('../../src/util');

const sandbox = sinon.createSandbox();

const fetch = sandbox.stub();

class TextEncoder {encode() {}}
class TextDecoder {decode() {}}

describe('Util', () => {

  before(() => {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
    global.fetch = fetch;
  });

  after(() => {
    Reflect.deleteProperty(global, 'TextEncoder');
    Reflect.deleteProperty(global, 'TextDecoder');
    Reflect.deleteProperty(global, 'fetch');
    sandbox.restore();
  });

  afterEach(() => sandbox.reset());

  it('should decode array buffer as string', () => {
    const string = 'string';
    sandbox.stub(TextDecoder.prototype, 'decode').returns(string);

    const buffer = new ArrayBuffer(100); // eslint-disable-line no-magic-numbers
    const decoded = util.arrayBufferToString(buffer);

    assert.equal(decoded, string);
  });

  it('should encode string as array buffer', () => {
    const buffer = new ArrayBuffer(100); // eslint-disable-line no-magic-numbers
    sandbox.stub(TextEncoder.prototype, 'encode').returns(buffer);

    const string = 'string';
    const encoded = util.stringToArrayBuffer(string);

    assert.equal(encoded, buffer);
  });

  it('should generate sha1 hash', () => {
    const crypto = {subtle: {digest() {}}};
    global.crypto = crypto;

    sandbox.stub(crypto.subtle, 'digest').resolves(new Uint8Array(1, 2, 3)); // eslint-disable-line no-magic-numbers

    return util.sha1('string').then((hash) => {
      assert.equal(hash, '00');
    });
  });

  it('should fetch without retrying when first attempt is successful', () => {
    const expectedResponse = {ok: true, status: 200};
    fetch.resolves(expectedResponse);
    const url = 'https://www.risevision.com';
    return util.fetchWithRetry(url).then((response) => {
      assert.equal(response, expectedResponse);
      sinon.assert.calledOnce(fetch);
    });
  });

  it('should retry fetch', () => {
    fetch.onFirstCall().rejects(new Error('fetch rejected'));
    const expectedResponse = {ok: true, status: 200};
    fetch.onSecondCall().resolves(expectedResponse);
    const url = 'https://www.risevision.com';
    const options = {};
    const retries = 2;
    const timeout = 0;
    return util.fetchWithRetry(url, options, retries, timeout).then((response) => {
      assert.equal(response, expectedResponse);
      sinon.assert.calledTwice(fetch);
    });
  });

  it('should reject fetch after many retries', () => {
    const expectedError = new Error('fetch rejected');
    fetch.rejects(expectedError);

    const url = 'https://www.risevision.com';
    const options = {};
    const retries = 2;
    const timeout = 0;
    return util.fetchWithRetry(url, options, retries, timeout).catch((error) => { // eslint-disable-line no-magic-numbers
      assert.equal(error, expectedError);
      sinon.assert.calledThrice(fetch);
    });
  });

  describe('URI Parser', () => {
    it('should parse GET URI', () => {
      const requestText =
        `GET /file1 HTTP/1.1
        Host: 127.0.0.1:8989
        User-Agent: curl/7.54.0
        Accept: */*`;

      const uri = util.parseUri(requestText);
      assert.equal(uri, '/file1');
    });

    it('should parse GET URI without query string', () => {
      const requestText =
        `GET /file?param1=1&param2=2 HTTP/1.1
        Host: 127.0.0.1:8989
        Connection: keep-alive
        Upgrade-Insecure-Requests: 1
        User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36
        Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8
        Accept-Encoding: gzip, deflate, br
        Accept-Language: en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7`;

      const uri = util.parseUri(requestText);
      assert.equal(uri, '/file');
    });

    it('should not parse POST URI', () => {
      const requestText =
        `POST / HTTP/1.1
        Host: localhost:8989
        User-Agent: curl/7.54.0
        Accept: */*
        Content-Length: 27
        Content-Type: application/x-www-form-urlencoded

        param1=value1&param2=value2`;

      const uri = util.parseUri(requestText);
      assert.equal(uri, null);
    });
  });
});
