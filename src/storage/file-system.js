const ONE_HUNDRED_MB = 100000000;
const FIVE_MB = 5000000;
const CACHE_CLEANUP_PERCENT_THRESHOLD = 0.9;

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
  return queryUsageAndQuota().then(({usedBytes, grantedBytes}) => grantedBytes - usedBytes);
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
  return createDirectory(dirName)
    .then(dirEntry => createFile(dirEntry, fileName))
    .then(fileEntry => writeFile(fileEntry, contentStream));
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
 * @param {fileHash} string
 * @returns {Promise.<Object>}
 */
function readCachedFileAsObject(fileHash) {
  return readFile(fileHash, 'cache')
  .then(readFileAsArrayBuffer)
  .then(buf=>{
    return Reflect.apply(String.fromCharCode, null, new Uint8Array(buf));
  })
  .then(str=>{
    try {
      return JSON.parse(str);
    } catch (err) {
      return Promise.reject(err);
    }
  });
}

/**
 * @param {File} file
 * @returns {Array.<File>}
 */
function sliceFileInChunks(file, chunkSize = ONE_HUNDRED_MB) {
  const size = file.size;
  const chunks = [];
  for (let start = 0; start <= size; start += chunkSize) {
    const end = Math.min(start + chunkSize, size);
    const slice = file.slice(start, end, file.type);
    chunks.push(slice);
  }
  return chunks;
}

function clearLeastRecentlyUsedFiles(dirName) {
  return queryUsageAndQuota().then(({usedBytes, grantedBytes}) => {
    if (usedBytes <= CACHE_CLEANUP_PERCENT_THRESHOLD * grantedBytes) {
      console.log(`not cleaning cache files, bytes used smaller than threshold: ${usedBytes}, threshold: ${CACHE_CLEANUP_PERCENT_THRESHOLD * grantedBytes}`);
      return Promise.resolve();
    }
    return readFilesSortedByModificationTime(dirName).then(entries => {
      if (entries.length === 0) {
        console.log(`not cleaning cache files, no entries to remove`);
        return Promise.resolve();
      }
      const leastRecentlyUsed = entries[0];
      console.log(`removing least recently used file: ${leastRecentlyUsed.file.name} ${leastRecentlyUsed.metadata.modificationTime}`);
      return removeFile(leastRecentlyUsed.file).then(() => {
        return clearLeastRecentlyUsedFiles(dirName);
      });
    });
  });
}

function removeFile(file) {
  return new Promise((resolve, reject) => file.remove(resolve, reject))
}

/**
 * @param {String} filePath
 * @param {String} version
 * @returns {Promise}
 */
function removeCacheFile(fileName) {
  const dirName = 'cache';
  return readFile(fileName, dirName).then(file => removeFile(file));
}

function queryUsageAndQuota() {
  return new Promise((resolve, reject) => {
    navigator.webkitPersistentStorage.queryUsageAndQuota((usedBytes, grantedBytes) => resolve({usedBytes, grantedBytes}), reject);
  });
}

function readFilesSortedByModificationTime(dirName) {
  return readDirEntries(dirName)
      .then(entries => entries.filter(entry => entry.isFile))
      .then(files => {
        const promises = files.map(file => getMetadata(file).then(metadata => ({file, metadata})));
        return Promise.all(promises)
          .then(allMetadata => {
              return allMetadata.sort((one, other) => one.metadata.modificationTime - other.metadata.modificationTime);
          });
      });
}

/**
 *
 * @param {Entry} file
 * @returns {Promise.<Metadata>}
 */
function getMetadata(file) {
  return new Promise((resolve, reject) => file.getMetadata(resolve, reject));
}

/**
 *
 * @param {String} dirName
 * @returns {Promise.<Entry[]>}
 */
function readDirEntries(dirName) {
  return createDirectory(dirName)
    .then(dirEntry => {
      return new Promise((resolve, reject) => {
        const dirReader = dirEntry.createReader();
        function readEntriesRecursively(entries = []) {
           dirReader.readEntries((results) => {
            if (results.length > 0) {
                readEntriesRecursively([...entries, ...results]);
            } else {
                resolve(entries);
            }
          }, reject);
        }
        readEntriesRecursively();
      });
    });
}

function requestFileSystem() {
  return new Promise((resolve, reject) => {
    // Requesting only 5MB but is not relevant because we have unlimitedStorage permission
    window.webkitRequestFileSystem(window.PERSISTENT, FIVE_MB, resolve, reject);
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
  readCachedFileAsObject,
  createDirectory,
  getAvailableSpace,
  checkAvailableDiskSpace,
  writeFileToDirectory,
  moveFileToDirectory,
  readFile,
  readFileAsArrayBuffer,
  sliceFileInChunks,
  clearLeastRecentlyUsedFiles,
  removeCacheFile,
  readDirEntries
}
