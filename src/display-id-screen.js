const windowManager = require('./window-manager');

function createViewModel(document) {

  const cont = document.querySelector('#continue');
  const errorMessageArea = document.getElementById('errorMessage');
  const links = document.querySelectorAll('a')

  links.forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = ev.target.href;
      windowManager.launchWebView(url);
    })
  });

  function showError(message) {
    errorMessageArea.innerHTML = `<span>${message}</span>`;
    errorMessageArea.style.display = 'block';
  }

  return {
    bindValidateDisplayId(handler) {
      cont.onclick = (ev) => {
        ev.preventDefault();
        const displayId = document.querySelector('#displayIdInput').value;
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
      windowManager.launchViewer(displayId)
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

function init(document, validator) {
  const viewModel = createViewModel(document);
  return createController(viewModel, validator);
}

module.exports = {
  createViewModel,
  createController,
  init
}
