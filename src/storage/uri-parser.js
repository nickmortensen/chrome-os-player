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

module.exports = {
  parseUri
}
