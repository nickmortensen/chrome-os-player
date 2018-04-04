const windowManager = require("./window-manager");
const validator = require('./display-id-validator');
const screen = require('./display-registration');

function init() {
  const [viewModel, controller] = screen.init(document, validator);
  viewModel.bindRegistrationControllerFunction(controller.validateDisplayId.bind(controller));

  window.addEventListener("message", (evt)=>{
    windowManager.setParentWindow(evt.source);
  });
}

document.addEventListener('DOMContentLoaded', init);
