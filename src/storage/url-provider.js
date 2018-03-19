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
    body: {
      data,
      hash
    },
    method: 'POST'
  };
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        return Promise.reject(Error(`Invalid response with status code ${response.status}`));
      }
      return response.body;
    });
}

module.exports = {
  getUrl
}
