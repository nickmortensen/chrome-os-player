const gcsClient = require('./gcs-client');

function readDisplayId() {
  return new Promise((resolve) => chrome.storage.local.get(items => resolve(items.displayId)));
}

function fetchContent() {
  return readDisplayId().then(displayId => {
    const bucketName = 'risevision-display-notifications';
    const filePath = `${displayId}/content.json`;
    return gcsClient.fetchJson(bucketName, filePath);
  });
}

module.exports = {
  fetchContent
}
