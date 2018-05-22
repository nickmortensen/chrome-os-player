const windowManager = require('../window-manager');

function createViewModel(document) {

  const secondsRemaining = document.getElementById('secondsRemaining');
  const secondsText = document.getElementById('secondsText');
  const actions = document.querySelectorAll('a, button');
  const continueButton = document.getElementById('continue');
  const cancelButton = document.getElementById('cancel');

  return {
    bindController(controller) {
      actions.forEach(action => {
        action.addEventListener('click', evt => {
          evt.preventDefault();
          controller.stopCountdown();
        });
      });

      continueButton.addEventListener('click', evt => {
        evt.preventDefault();
        controller.continue();
      });

      cancelButton.addEventListener('click', evt => {
        evt.preventDefault();
        controller.cancel();
      });
    },

    updateSecondsRemaining(seconds) {
      secondsRemaining.innerText = seconds;
      if (seconds === 1) {
        secondsText.innerText = 'second.';
      }
    }
  }
}

function createController(viewModel, displayId) {

  const controller = {
    stopCountdown() {
      clearInterval(runningTimer);
    },

    continue() {
      windowManager.launchViewer(displayId);
    },

    cancel() {
      windowManager.closeCurrentWindow();
    }
  };

  const ONE_SECOND = 1000;
  const runningTimer = setInterval(setSeconds, ONE_SECOND);
  let seconds = 10;

  function setSeconds() {
    seconds -= 1;
    if (seconds === 0) {
      controller.stopCountdown();
      controller.continue();
    } else {
      viewModel.updateSecondsRemaining(seconds);
    }
  }

  return controller;
}

function init(document, displayId) {
  const viewModel = createViewModel(document);
  const controller = createController(viewModel, displayId);
  viewModel.bindController(controller);

  return [
    viewModel,
    controller
  ];
}

module.exports = {
  createViewModel,
  createController,
  init
}
