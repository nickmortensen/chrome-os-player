/**
 * @param {object} token
 * @returns {Promise.<string>}
 */
function getUrl(token) {
  if (!token || !token.data || !token.data.timestamp || !token.data.filePath || !token.data.displayId || !token.hash) {
    return Promise.reject(Error('Invalid token provided'));
  }

  const {data, hash} = token;
  const url = 'https://services.risevision.com/urlprovider/';
  const options = {
    body: JSON.stringify({data, hash}),
    headers: {'Content-Type': 'application/json'},
    method: 'POST'
  };
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        return Promise.reject(Error(`Invalid response with status code ${response.status}`));
      }
      return response.text();
    })
    .then(signedUrl => {
      const separator = signedUrl.includes('?') ? '&' : '?';
      return `${signedUrl}${separator}displayId=${data.displayId}`;
    });
}

module.exports = {
  getUrl
}
