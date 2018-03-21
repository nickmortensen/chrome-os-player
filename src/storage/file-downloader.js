const fileSystem = require("./file-system");
const urlProvider = require("./url-provider");

/**
 * Downloads a file entry and saves it to disk
 * @param {object} entry with filePath, version and token properties
 * @returns {Promise.<FileEntry>}
 */
function download(entry) {
  const {filePath, version, token} = entry;

  return fileSystem.checkAvailableDiskSpace()
    .then((availableSpace) => {
      if (!availableSpace) {
        return Promise.reject(Error('Insufficient disk space'));
      }

      return urlProvider.getUrl(token);
    })
    .then((signedUrl) => {
      if (!signedUrl) {
        return Promise.reject(Error('No signed URL'));
      }

      return requestFile(signedUrl);
    })
    .then(response => validateResponse(response))
    .then(response => {
      const fileName = `${filePath}${version}`;
      const dirName = 'download';
      return fileSystem.writeFileToDirectory(fileName, response.body, dirName);
    })
    .then((fileEntry) => fileSystem.moveFileToDirectory(fileEntry, 'cache'));
}

function requestFile(signedUrl, retries = 2) { // eslint-disable-line no-magic-numbers
  return fetch(signedUrl).catch(error => {
    if (retries <= 0) {
      return Promise.reject(error);
    }

    return requestFile(signedUrl, retries - 1);
  });
}

function validateResponse(response) {
  if (!response.ok) {
    return Promise.reject(Error(`Invalid response with status code ${response.status}`));
  }

  const contentLength = response.headers.get('Content-Length');
  const fileSize = Number.parseInt(contentLength, 10) || 0;

  return fileSystem.checkAvailableDiskSpace(fileSize)
    .then((availableSpace) => {
      if (!availableSpace) {
        return Promise.reject(Error('Insufficient disk space'));
      }

      return response;
    });
}

module.exports = {
  download
}
