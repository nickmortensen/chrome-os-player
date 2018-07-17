/* eslint-disable no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const gcsClient = require('../../src/gcs-client');
const logger = require('../../src/logging/logger');

const contentLoader = require('../../src/content-loader');

const sandbox = sinon.createSandbox();

describe('Content Loader', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  beforeEach(() => sandbox.stub(logger, 'error'));

  it('should load local content', () => {
    const localData = {displayId: 'displayId', content: {content: {presentations: []}}};
    chrome.storage.local.get.yields(localData);
    sandbox.stub(gcsClient, 'fetchJson').resolves({content: {presentations: []}});

    return contentLoader.loadContent().then((data) => {
      assert.equal(data, localData.content);
      sinon.assert.notCalled(gcsClient.fetchJson);
    });
  });

  it('should fetch content from GCS', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    sandbox.stub(gcsClient, 'fetchJson').resolves({content: {presentations: []}});

    return contentLoader.loadContent().then(() => {
      sinon.assert.calledWith(gcsClient.fetchJson, 'risevision-display-notifications', 'displayId/content.json');
    });
  });

  it('should rewrite image and video widget URLs', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    const contentData = {
      content: {
        presentations: [
          {
            layout: `
              <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
              <html>
              <script language="javascript">
              var presentationData = {
                  "widget1": "http://s3.amazonaws.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "widget2": "https://widgets.risevision.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "widget3": "http://s3.amazonaws.com/widget-video-rv/1.1.0/dist/widget.html",
                  "widget4": "http://s3.amazonaws.com/widget-text/1.0.0/dist/widget.html"
              }
              </script>
              </html>
            `
          }
        ]
      }
    };
    sandbox.stub(gcsClient, 'fetchJson').resolves(contentData);

    return contentLoader.loadContent().then((data) => {
      const layout = data.content.presentations[0].layout;
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-image-test/stage-0/0.1.1/dist/widget.html'), -1);
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-video-rv/1.1.0/dist/widget.html'), -1);
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-text/1.0.0/dist/widget.html') > 0, true);
    });
  });

  it('should return null and log error when content from GCS is empty', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    sandbox.stub(gcsClient, 'fetchJson').resolves({});

    return contentLoader.fetchContent().then((data) => {
      sinon.assert.calledWith(logger.error, 'empty content data');
      assert.equal(data, null);
    });
  });

  it('should remove content from local storage after it gets loaded', () => {
    const storedData = {
      displayId: 'displayId',
      content: {
        content: {
          presentations: [
            {
              layout: `
              <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
              <html>
              <script language="javascript">
              var presentationData = {
                  "widget1": "http://s3.amazonaws.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "widget2": "https://widgets.risevision.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "widget3": "http://s3.amazonaws.com/widget-video-rv/1.1.0/dist/widget.html",
                  "widget4": "http://s3.amazonaws.com/widget-text/1.0.0/dist/widget.html"
              }
              </script>
              </html>
            `
            }
          ]
        }
      }
    };

    chrome.storage.local.get.yields(storedData);

    return contentLoader.loadContent().then(() => {
      sinon.assert.calledWith(chrome.storage.local.remove, 'content');
    });
  });

});
