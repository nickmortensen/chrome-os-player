const validator = require('./display-id-validator');
const screen = require('./display-id-screen');

function init() {
  const form = document.querySelector('form');
  const errorMessageArea = document.getElementById('errorMessage');

  screen.init(form, errorMessageArea, validator);
}

document.addEventListener("DOMContentLoaded", init);
