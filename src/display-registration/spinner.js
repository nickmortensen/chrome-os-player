const windowManager = require('../window-manager');

function createViewModel(document) {
  const cancelButton = document.getElementById('cancel');

  cancelButton.addEventListener("click", evt=>{
    evt.preventDefault();
    windowManager.closeCurrentWindow();
  });
}

function init(document) {
  createViewModel(document);
}

module.exports = {
  init
}
