const validator = require('./display-id-validator');

function init() {
  const form = document.querySelector('form');
  form.onsubmit = () => {
    const displayId = form.querySelector('input').value.toUpperCase();

    const errorMessage = document.getElementById('errorMessage');
    if (!displayId) {
      errorMessage.innerHTML = '<span>Please enter a Display ID</span>';
      errorMessage.style.display = 'block';
      return;
    }

    validator.validateDisplayId(displayId)
      .then(() => {
        console.log('Launch viewer');
      })
      .catch(() => {
        errorMessage.innerHTML = `<span>The Display ID <b>${displayId}</b> is not valid or does not exist`;
        errorMessage.style.display = 'block';
      });
  };
}

document.addEventListener("DOMContentLoaded", init);
