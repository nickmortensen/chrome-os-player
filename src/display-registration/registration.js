const displayIdHtml = require('./display-id.html');
const displayIdValidator = require('./display-id-validator');
const claimIdHtml = require('./claim-id.html');
const claimIdSubmittor = require('./claim-id-submittor');
const displayRegistrationScreen = require('./display-registration');
const countdownHtml = require('./countdown.html');
const countdownScreen = require('./countdown');

window.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('body');

  function goToDisplayId() {
    body.innerHTML = displayIdHtml;
    const [viewModel, controller] = displayRegistrationScreen.init(document, displayIdValidator);
    viewModel.bindRegistrationControllerFunction(controller.validateDisplayId.bind(controller));
    const claimIdLink = document.getElementById('claimIdLink');
    claimIdLink.addEventListener('click', (event) => {
      event.preventDefault();
      goToClaimId();
    });
  }

  function goToClaimId() {
    body.innerHTML = claimIdHtml;
    const [viewModel, controller] = displayRegistrationScreen.init(document, claimIdSubmittor);
    viewModel.bindRegistrationControllerFunction(controller.submitClaimId.bind(controller));
    const displayIdLink = document.getElementById('displayIdLink');
    displayIdLink.addEventListener('click', (event) => {
      event.preventDefault();
      goToDisplayId();
    });
  }

  function showCountdown(displayId) {
    body.innerHTML = countdownHtml;
    countdownScreen.init(document, displayId);
    const displayIdLink = document.getElementById('displayIdLink');
    displayIdLink.addEventListener('click', (event) => {
      event.preventDefault();
      goToDisplayId();
    });
  }

  chrome.storage.local.get((items) => {
    if (items.displayId) {
      showCountdown(items.displayId);
    } else {
      goToDisplayId();
    }
  });
});
