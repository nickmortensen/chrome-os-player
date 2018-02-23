const assert = require('assert');
const sinon = require('sinon');
const validator = require('../../src/display-id-validator.js');
const fetch = sinon.stub();

describe('Display ID Validator', () => {

  before(() => {
    global.fetch = fetch;
  })

  beforeEach(() => fetch.resetBehavior());

  it('validates a display id', () => {
    fetch.returns(Promise.resolve({
      json() {
        return Promise.resolve({
          item: {
            companyId: 'A'
          }
        });
      }
    }));

    return validator.validateDisplayId('--XXX--AKQ2K8D9D9VE')
      .then((resp)=>{
        assert.equal(resp.item.companyId, 'A');
      });
  });

  it('rejects when validation fetch fails', () => {
    fetch.returns(Promise.reject(Error()));

    return validator.validateDisplayId('--XXX--AKQ2K8D9D9VE')
      .then(() => assert.fail('catch should have been called'))
      .catch((err) => {
        assert.ok(err);
      });
  });

  it('rejects when not validated', () => {
    fetch.returns(Promise.resolve({
      json() {
        return {
          error: {
            code: 500,
            message: 'test failure'
          }
        };
      }
    }));

    return validator.validateDisplayId('--XXX--AKQ2K8D9D9VE')
    .then(() => assert.fail('catch should have been called'))
    .catch((err) => {
        assert.equal(err.message, 'test failure');
      });
  });

  it('rejects when display has been deleted', () => {
    fetch.returns(Promise.resolve({
      json() {
        return {
          size: '2'
        };
      }
    }));

    return validator.validateDisplayId('--XXX--AKQ2K8D9D9VE')
      .then(() => assert.fail('catch should have been called'))
      .catch((err) => {
        assert.equal(err.message, 'Display has been deleted');
      });
  });

  after(() => {
    Reflect.deleteProperty(global, 'fetch');
  })

});
