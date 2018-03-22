/* eslint-disable no-magic-numbers */
const sinon = require('sinon');

const logger = require('../../src/logging/logger');

const rebootScheduler = require('../../src/reboot-scheduler');

const sandbox = sinon.createSandbox();

describe('Reboot Scheduler', () => {

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  it('should not schedule reboot when content is empty', () => {
    rebootScheduler.scheduleRebootFromViewerContents();

    sinon.assert.notCalled(chrome.runtime.restartAfterDelay);
  });

  it('should not schedule reboot when display is empty', () => {
    const content = {};

    rebootScheduler.scheduleRebootFromViewerContents(content);

    sinon.assert.notCalled(chrome.runtime.restartAfterDelay);
  });

  it('should not schedule reboot when restart is not enable', () => {
    const content = {display: {restartEnabled: false}};

    rebootScheduler.scheduleRebootFromViewerContents(content);

    sinon.assert.notCalled(chrome.runtime.restartAfterDelay);
  });

  it('should not schedule reboot and log error when restart time is not valid', () => {
    sandbox.stub(logger, 'log');

    const content = {display: {restartEnabled: true, restartTime: 'tomorrow'}};

    rebootScheduler.scheduleRebootFromViewerContents(content);

    sinon.assert.notCalled(chrome.runtime.restartAfterDelay);
    sinon.assert.calledWith(logger.log, 'scheduled reboot error', 'invalid reboot schedule time: tomorrow')
  });

  it('should schedule reboot successfully', () => {
    const nowDate = Date.now();
    const oneHour = 60 * 60 * 1000;
    const restartDate = new Date(nowDate + oneHour);
    const hh = `${restartDate.getHours()}`.padStart(2, '0');
    const mm = `${restartDate.getMinutes()}`.padStart(2, '0');
    const content = {display: {restartEnabled: true, restartTime: `${hh}:${mm}`}};

    rebootScheduler.scheduleRebootFromViewerContents(content);

    sinon.assert.calledWith(chrome.runtime.restartAfterDelay, 3600);
  });
});
