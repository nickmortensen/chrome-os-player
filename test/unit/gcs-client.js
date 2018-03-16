const assert = require('assert');
const sinon = require('sinon');

const gcsClient = require('../../src/gcs-client');

const sandbox = sinon.createSandbox();
const fetch = sandbox.stub();

describe('GCS Client', () => {

  before(() => global.fetch = fetch);

  after(() => Reflect.deleteProperty(global, 'fetch'));

  afterEach(() => sandbox.restore());

  it('should fetch json', () => {
    const expectedContent = {};
    fetch.resolves({json() {return Promise.resolve(expectedContent);}});

    const bucketName = 'risevision-display-notifications';
    const filePath = 'DISPLAYID/content.json';
    const expectedGCSUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&ifGenerationNotMatch=-1`;

    return gcsClient.fetchJson(bucketName, filePath).then((content) => {
      assert(content === expectedContent);
      sinon.assert.calledWith(fetch, expectedGCSUrl);
    });
  });

});
