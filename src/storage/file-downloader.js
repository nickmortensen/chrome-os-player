const fileSystem = require("./file-system");
const urlProvider = require("./url-provider");
const util = require('../util');

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

      return fetch(signedUrl, {mode: 'cors', method: 'HEAD'})
        .then(response => checkAvailableDiskSpace(response))
        .then(() => requestFile(signedUrl));
    })
    .then(response => {
      return util.sha1(`${filePath}${version}`).then(fileName => {
        const dirName = 'download';
        return fileSystem.writeFileToDirectory(fileName, response.body, dirName);
      });
    })
    .then(fileEntry => fileSystem.moveFileToDirectory(fileEntry, 'cache'));
}

function requestFile(signedUrl, retries = 2) { // eslint-disable-line no-magic-numbers
  return fetch(signedUrl, {mode: 'cors'}).catch(error => {
    if (retries <= 0) {
      return Promise.reject(error);
    }

    return requestFile(signedUrl, retries - 1);
  });
}

function checkAvailableDiskSpace(response) {
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

function downloadUrl(url, fileName) {

  return fileSystem.checkAvailableDiskSpace()
    .then((availableSpace) => {
      if (!availableSpace) {
        return Promise.reject(Error('Insufficient disk space'));
      }

      return requestFile(url);
    })
    .then(response => checkAvailableDiskSpace(response))
    .then(response => {
      const dirName = 'download';
      return fileSystem.writeFileToDirectory(fileName, response.body, dirName);
    })
    .then((fileEntry) => {
      console.log(fileEntry);
      return fileSystem.moveFileToDirectory(fileEntry, 'cache');
    })
    .then(fileEntry => console.log(fileEntry));
}

module.exports = {
  download,
  downloadUrl
}
