const assert = require('assert');
const sinon = require('sinon');

const util = require('../../src/util');

const sandbox = sinon.createSandbox();

class TextEncoder {encode() {}}
class TextDecoder {decode() {}}

describe('Util', () => {

  before(() => {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  });

  after(() => {
    Reflect.deleteProperty(global, 'TextEncoder');
    Reflect.deleteProperty(global, 'TextDecoder');
  });

  afterEach(() => sandbox.restore());

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
});
