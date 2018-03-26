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

module.exports = {
  parseUri,
  arrayBufferToString,
  stringToArrayBuffer
}
