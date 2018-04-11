/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToString(buffer) {
  const decoder = new TextDecoder('utf8');
  return decoder.decode(buffer);
}

/**
 * @param {string} string
 * @returns {ArrayBuffer}
 */
function stringToArrayBuffer(string) {
  const encoder = new TextEncoder('utf8');
  return encoder.encode(string);
}

function dataUrlToArrayBuffer(dataUrl) {
  const byteString = atob(dataUrl.split(',')[1]);
  return stringToArrayBuffer(byteString);
}

function dataUrlToImageData(dataUrl) {
  return new Promise(function(resolve) {
    const canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        image = new Image();
    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    }, false);
    image.src = dataUrl;
  });
}

/**
 * Returns a promise that resolves to a string that is the hex value of the SHA-1 hash of the provided string
 * @param {string} string
 * @returns {Promise.<String>}
 */
function sha1(string) {
  return crypto.subtle.digest('SHA-1', stringToArrayBuffer(string))
    .then(value => bufferToHex(value));
}

/**
 *
 * @param {string} url
 * @param {object} options
 * @param {number} [retries]
 * @param {number} [timeout]
 */
function fetchWithRetry(url, options = {}, retries = 2, timeout = 1000) { // eslint-disable-line no-magic-numbers
  return fetch(url, options).catch(error => {
    if (retries <= 0) {
      return Promise.reject(error);
    }

    return new Promise((resolve) => setTimeout(resolve, timeout)).then(() => fetchWithRetry(url, options, retries - 1, timeout));
  });
}

function bufferToHex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), value => value.toString(16).padStart(2, '0')).join(''); // eslint-disable-line
}

module.exports = {
  arrayBufferToString,
  stringToArrayBuffer,
  dataUrlToArrayBuffer,
  dataUrlToImageData,
  sha1,
  fetchWithRetry
}
