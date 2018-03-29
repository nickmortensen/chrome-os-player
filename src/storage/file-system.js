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
function writeFileToDirectory(fileName, contentStream, dirName, type) {
  return createDirectory(dirName)
    .then(dirEntry => createFile(dirEntry, fileName))
    .then(fileEntry => writeFile(fileEntry, contentStream, type));
}

/**
 * @param {FileEntry} fileEntry
 * @param {string} dirName
 * @returns {Promise.<FileEntry>}
 */
function moveFileToDirectory(fileEntry, dirName) {
  return createDirectory(dirName)
    .then(dirEntry => {
      return new Promise((resolve, reject) => fileEntry.moveTo(dirEntry, fileEntry.name, resolve, reject));
    });
}

/**
 * @param {string} fileName
 * @param {string} dirName
 * @returns {Promise.<File>}
 */
function readFile(fileName, dirName) {
  return createDirectory(dirName)
    .then(dirEntry => {
      return new Promise((resolve, reject) => dirEntry.getFile(fileName, {}, resolve, reject));
    })
    .then((fileEntry) => {
      return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    });
}

/**
 * @param {FileEntry} fileEntry
 * @returns {Promise.<ArrayBuffer>}
 */
function readFileAsArrayBuffer(fileEntry) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        resolve(evt.target.result);
      }
    }
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(fileEntry);
  });
}

/**
 * @param {File} file
 * @returns {Array.<Promise.<ArrayBuffer>>}
 */
function readChunks(file, chunkSize = 1000000) { // eslint-disable-line no-magic-numbers
  console.log('slicing file', file);
  const size = file.size;
  const chunks = [];
  for (let start = 0; start <= size; start += chunkSize) {
    const end = Math.min(start + chunkSize, size);
    console.log(`creating chunk from ${start} to ${end}`);

    const slice = file.slice(start, end, file.type);
    chunks.push({start, end, slice});
  }
  return chunks;
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

function writeFile(fileEntry, contentStream, type) {
  return new Promise((resolve, reject) => {
    fileEntry.createWriter((fileWriter) => {
      processChunkedContents(contentStream, fileWriter, type)
        .then(() => resolve(fileEntry))
        .catch(reject);
    });
  });
}

function processChunkedContents(contentStream, fileWriter, type) {
  const fileWriteableStream = new WritableStream({
    write(chunk) {
      return new Promise((resolve, reject) => {
        fileWriter.seek(fileWriter.length);
        fileWriter.onwriteend = resolve
        fileWriter.onerror = reject
        fileWriter.write(new Blob([chunk], {type}));
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
  moveFileToDirectory,
  readFile,
  readFileAsArrayBuffer,
  readChunks
}
