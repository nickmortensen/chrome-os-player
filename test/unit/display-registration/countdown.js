/* eslint-disable func-style */
const assert = require('assert');
const sinon = require('sinon');
const chrome = require('sinon-chrome/apps');
const windowManager = require('../../../src/window-manager');

const screen = require('../../../src/display-registration/countdown');

const sandbox = sinon.createSandbox();

describe('Countdown Screen', () => {

  const viewModel = {
    bindController() {},
    updateSecondsRemaining() {}
  }

  after(() => chrome.flush());

  afterEach(() => sandbox.restore());

  it('shows 10 second countdown', () => {
    sandbox.stub(windowManager, 'launchViewer').resolves();
    sandbox.spy(viewModel, 'updateSecondsRemaining');
    const clock = sandbox.useFakeTimers();

    const displayId = 'displayId';
    screen.createController(viewModel, displayId);

    clock.runAll();

    sinon.assert.callCount(viewModel.updateSecondsRemaining, 9);
    const firstCall = viewModel.updateSecondsRemaining.firstCall.args[0];
    assert.equal(firstCall, 9);
    const secondCall = viewModel.updateSecondsRemaining.secondCall.args[0];
    assert.equal(secondCall, 8);
    const thirdCall = viewModel.updateSecondsRemaining.thirdCall.args[0];
    assert.equal(thirdCall, 7);
    const lastCall = viewModel.updateSecondsRemaining.lastCall.args[0];
    assert.equal(lastCall, 1);
  });

  it('launches viewer after 10 second countdown', () => {
    sandbox.stub(windowManager, 'launchViewer').resolves();
    sandbox.spy(viewModel, 'updateSecondsRemaining');
    const clock = sandbox.useFakeTimers();

    const displayId = 'displayId';
    screen.createController(viewModel, displayId);

    clock.runAll();

    sinon.assert.calledWith(windowManager.launchViewer, displayId);
  });

  it('launches viewer on continue', () => {
    sandbox.stub(windowManager, 'launchViewer').resolves();
    sandbox.useFakeTimers();

    const displayId = 'displayId';
    const controller = screen.createController(viewModel, displayId);

    controller.continue();

    sinon.assert.called(windowManager.launchViewer);
  });

});
