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

/**
 * @param {string} requestText
 * @returns {string} uri without query string
 */
function parseUri(requestText) {
  const matches = requestText.match(/GET\s(\S+)\s/);
  if (matches && matches.length > 0) {
    return matches[1].split('?')[0];
  }
  return null;
}

function bufferToHex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), value => padStart(value.toString(16))).join(''); // eslint-disable-line
}

function padStart(value) {
  return `00${value}`.substr(-2); // eslint-disable-line no-magic-numbers
}

module.exports = {
  arrayBufferToString,
  stringToArrayBuffer,
  sha1,
  fetchWithRetry,
  parseUri,
  getDisplayId
}

function getDisplayId() {
  return new Promise((res, rej)=>{
    chrome.storage.local.get('displayId', items=>{
      if (chrome.runtime.lastError) {
        return rej(Error(chrome.runtime.lastError));
      }

      res(items.displayId)
    })
  })
}
