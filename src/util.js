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
  sha1,
  fetchWithRetry
}
