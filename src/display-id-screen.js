function createViewModel(form, errorMessageArea) {

  function showError(message) {
    errorMessageArea.innerHTML = `<span>${message}</span>`;
    errorMessageArea.style.display = 'block';
  }

  return {
    bindValidateDisplayId(handler) {
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const displayId = form.querySelector('input').value;
        handler(displayId.toUpperCase().trim());
      }
    },

    showEmptyDisplayIdError() {
      showError('Please enter a Dislay ID');
    },

    showInvalidDisplayIdError(displayId) {
      showError(`The Display ID <b>${displayId}</b> is not valid or does not exist`);
    },

    launchViewer(displayId) {
      console.log(`Launch viewer for display ID: ${displayId}`);
    }
  }
}

function createController(viewModel, validator) {
  const controller = {
    validateDisplayId(displayId) {
      if (!displayId) {
        viewModel.showEmptyDisplayIdError();
        return Promise.reject(Error('empty display id'));
      }

      return validator.validateDisplayId(displayId)
        .then(() => chrome.storage.local.set({displayId}))
        .then(() => viewModel.launchViewer(displayId))
        .catch(() => viewModel.showInvalidDisplayIdError(displayId));
    }
  };

  viewModel.bindValidateDisplayId(controller.validateDisplayId.bind(controller));

  return controller;
}

function init(form, errorMessageArea, validator) {
  const viewModel = createViewModel(form, errorMessageArea);
  return createController(viewModel, validator);
}

module.exports = {
  createViewModel,
  createController,
  init
}
