/* eslint-disable no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const gcsClient = require('../../src/gcs-client');
const logger = require('../../src/logging/logger');

const contentLoader = require('../../src/content-loader');
const updateFrequencyLogger = require('../../src/update-frequency-logger');

const sandbox = sinon.createSandbox();

describe('Content Loader', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(logger, 'error');
    sandbox.stub(updateFrequencyLogger, 'logContentChanges');
  });

  it('should load local content', () => {
    const localData = {displayId: 'displayId', content: {content: {presentations: []}}};
    chrome.storage.local.get.yields(localData);
    sandbox.stub(gcsClient, 'fetchJson').resolves({content: {presentations: []}});

    return contentLoader.loadContent().then((data) => {
      assert.equal(data, localData.content);
      sinon.assert.notCalled(gcsClient.fetchJson);
    });
  });

  it('should fetch content from GCS and log content changes', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    sandbox.stub(gcsClient, 'fetchJson').resolves({content: {presentations: []}});

    return contentLoader.loadContent().then(() => {
      sinon.assert.called(updateFrequencyLogger.logContentChanges);
      sinon.assert.calledWith(gcsClient.fetchJson, 'risevision-display-notifications', 'displayId/content.json');
    });
  });

  it('should rewrite supported widget URLs', () => {
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
                  "imageTestS3": "http://s3.amazonaws.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "imageTestGCS": "https://widgets.risevision.com/widget-image-test/stage-0/0.1.1/dist/widget.html",
                  "videoRvS3": "http://s3.amazonaws.com/widget-video-rv/1.1.0/dist/widget.html",
                  "textS3": "http://s3.amazonaws.com/widget-text/1.0.0/dist/widget.html",
                  "googleCalendarS3": "http://s3.amazonaws.com/widget-google-calendar/1.0.0/dist/widget.html",
                  "googleSheetsS3": "http://s3.amazonaws.com/widget-google-spreadsheet/1.0.0/dist/widget.html",
                  "htmlS3": "http://s3.amazonaws.com/widget-html/1.0.0/dist/widget.html",
                  "rssS3": "http://s3.amazonaws.com/widget-rss/1.0.0/dist/widget.html",
                  "timeDateS3": "http://s3.amazonaws.com/widget-time-date/1.0.0/dist/widget.html",
                  "webPageS3": "http://s3.amazonaws.com/widget-web-page/1.0.0/dist/widget.html"
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
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-text/1.0.0/dist/widget.html'), -1)
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-google-calendar/1.0.0/dist/widget.html'), -1)
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-google-spreadsheet/1.0.0/dist/widget.html'), -1)
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-html/1.0.0/dist/widget.html'), -1);
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-rss/1.0.0/dist/widget.html'), -1);
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-time-date/1.0.0/dist/widget.html'), -1);
      assert.equal(layout.indexOf('http://s3.amazonaws.com/widget-web-page/1.0.0/dist/widget.html'), -1);
    });
  });

  it('should return null and log error when content from GCS is empty', () => {
    chrome.storage.local.get.yields({displayId: 'displayId'});
    sandbox.stub(gcsClient, 'fetchJson').resolves({});

    return contentLoader.fetchContent().then((data) => {
      sinon.assert.calledWith(logger.error, 'player - empty content data');
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
