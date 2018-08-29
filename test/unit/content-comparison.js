/* eslint-disable no-magic-numbers */
const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');

const contentComparison = require('../../src/content-comparison');

const sandbox = sinon.createSandbox();

describe('Content Comparison', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  it('should retrieve presentation dates from the content.json format', () => {
    const contentJsonData = {
      content: {
        irrelevantData: "xxx",
        presentations: [
          {
            "id": "pres-test-id-1",
            "changeDate": "test-change-date-1"
          },
          {
            "id": "pres-test-id-2",
            "changeDate": "test-change-date-2"
          }
        ]
      }
    };

    const expectedTransformation = {
      "pres-test-id-1": "test-change-date-1",
      "pres-test-id-2": "test-change-date-2"
    };

    const testResult = contentComparison.getPresDatesFromContent(contentJsonData);
    assert.deepEqual(testResult, expectedTransformation);
  });

  it('should recognize unchanged presentation change dates', () => {
    const newData = {
      content: {
        presentations: [
          {
            "id": "pres-id-1",
            "changeDate": "date-1"
          },
          {
            "id": "pres-id-2",
            "changeDate": "date-2"
          }
        ],
        schedule: {}
      }
    };

    const localData = {
      presDates: {
        "pres-id-1": "date-1",
        "pres-id-2": "date-2"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.aPresentationHasChanged === false);
    });
  });

  it('should recognize changed presentation change dates', () => {
    const newData = {
      content: {
        presentations: [
          {
            "id": "pres-id-1",
            "changeDate": "date-1-new"
          },
          {
            "id": "pres-id-2",
            "changeDate": "date-2"
          }
        ],
        schedule: {}
      }
    };

    const localData = {
      presDates: {
        "pres-id-1": "date-1",
        "pres-id-2": "date-2"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.aPresentationHasChanged === true);
    });
  });

  it('should not indicate change if a presentation has been removed', () => {
    const newData = {
      content: {
        presentations: [
          {
            "id": "pres-id-2",
            "changeDate": "date-2"
          }
        ],
        schedule: {}
      }
    };

    const localData = {
      presDates: {
        "pres-id-1": "date-1",
        "pres-id-2": "date-2"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.aPresentationHasChanged === false);
    });
  });

  it('should recognize unchanged schedule change date', () => {
    const newData = {
      content: {
        presentations: [],
        schedule: {
          "id": "sched-id",
          "changeDate": "sched-date"
        }
      }
    };

    const localData = {
      schedDate: {
        "id": "sched-id",
        "changeDate": "sched-date"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.theScheduleHasChanged === false);
    });
  });

  it('should recognize changed schedule change date', () => {
    const newData = {
      content: {
        presentations: [],
        schedule: {
          "id": "sched-id",
          "changeDate": "sched-date-new"
        }
      }
    };

    const localData = {
      schedDate: {
        "id": "sched-id",
        "changeDate": "sched-date"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.theScheduleHasChanged === true);
    });
  });

  it('should recognize changed schedule id', () => {
    const newData = {
      content: {
        presentations: [],
        schedule: {
          "id": "sched-id-new",
          "changeDate": "sched-date"
        }
      }
    };

    const localData = {
      schedDate: {
        "id": "sched-id",
        "changeDate": "sched-date"
      }
    };

    chrome.storage.local.get.yields(localData);

    return contentComparison.compareContentData(newData)
    .then(result=>{
      assert(result.theScheduleHasChanged === true);
    });
  });

  describe("Content.json data object validation", ()=>{
    it('emptiness', () => {
      assert.rejects(contentComparison.compareContentData())
    });

    it('missing content object', () => {
      assert.rejects(contentComparison.compareContentData({}))
    });

    it('missing schedule object', () => {
      assert.rejects(contentComparison.compareContentData({
        content: {
          presentations: []
        }
      }))
    });

    it('missing presentation object', () => {
      assert.rejects(contentComparison.compareContentData({
        content: {
          schedule: {}
        }
      }))
    });

    it('passing', () => {
      assert.doesNotReject(contentComparison.compareContentData({
        content: {
          schedule: {},
          presentations: []
        }
      }))
    });
  });

});
