const validator = require('./display-id-validator');
const screen = require('./display-id-screen');

function init() {
  screen.init(document, validator);
}

document.addEventListener('DOMContentLoaded', init);
