/**
 * Creates a new directory under root.
 * @param {string} name
 * @returns {Promise.<DirectoryEntry>}
 */
function createDirectory(name) {
  return requestFileSystem()
    .then((fs) => getDirectory(fs, name, {create: true}));
}

/**
 * Returns the available space in bytes
 * @returns {Promise.<number>}
 */
function getAvailableSpace() {
  return new Promise((resolve, reject) => {
    navigator.webkitPersistentStorage.queryUsageAndQuota((usedBytes, grantedBytes) => resolve(grantedBytes - usedBytes), reject);
  });
}

/**
 * Returns a boolean indicating if there's enough space to save the file size passed as param
 * @param {number} fileSize
 * @returns {Promise.<boolean>}
 */
function checkAvailableDiskSpace(fileSize = 0) {
  return getAvailableSpace().then(freeSpace => {
    return freeSpace - fileSize > 0;
  });
}

/**
 * @param {string} fileName
 * @param {ReadableStream} contentStream
 * @param {string} dirName
 * @returns {Promise.<FileEntry>}
 */
function writeFileToDirectory(fileName, contentStream, dirName) {
  return requestFileSystem()
    .then(fs => createDirectory(fs, dirName))
    .then(dirEntry => createFile(dirEntry, fileName))
    .then(fileEntry => writeFile(fileEntry, contentStream));
}

/**
 * @param {FileEntry} fileEntry
 * @param {string} dirName
 * @returns {Promise.<FileEntry>}
 */
function moveFileToDirectory(fileEntry, dirName) {
  return requestFileSystem()
    .then(fs => createDirectory(fs, dirName))
    .then(dirEntry => {
      return new Promise((resolve, reject) => fileEntry.moveTo(dirEntry, resolve, reject));
    });
}

function requestFileSystem() {
  return new Promise((resolve, reject) => {
    // Requesting only 5MB but is not relevant because we have unlimitedStorage permission
    const FIVE_MEGA = 5 * 1024 * 1024; // eslint-disable-line no-magic-numbers
    window.webkitRequestFileSystem(window.PERSISTENT, FIVE_MEGA, resolve, reject);
  });
}

function getDirectory(fs, name, options = {create: false}) {
  return new Promise((resolve, reject) => {
    fs.root.getDirectory(name, options, resolve, reject);
  });
}

function createFile(dir, name) {
  return new Promise((resolve, reject) => dir.getFile(name, {create: true}, resolve, reject));
}

function writeFile(fileEntry, contentStream) {
  return new Promise((resolve, reject) => {
    fileEntry.createWriter((fileWriter) => {
      processChunkedContents(contentStream, fileWriter)
        .then(() => resolve(fileEntry))
        .catch(reject);
    });
  });
}

function processChunkedContents(contentStream, fileWriter) {
  const fileWriteableStream = new WritableStream({
    write(chunk) {
      return new Promise((resolve, reject) => {
        fileWriter.seek(fileWriter.length);
        fileWriter.onwriteend = resolve
        fileWriter.onerror = reject
        fileWriter.write(new Blob([chunk]));
      });
    }
  });
  return contentStream.pipeTo(fileWriteableStream);
}

module.exports = {
  createDirectory,
  getAvailableSpace,
  checkAvailableDiskSpace,
  writeFileToDirectory,
  moveFileToDirectory
}
