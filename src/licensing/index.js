const viewerMessaging = require('../messaging/viewer-messaging');
const store = require('./store');
const storageLocalMessaging = require('../storage/messaging/local-messaging-helper');
const storageMessaging = require('../storage/messaging/messaging');
const fileSystem = require('../storage/file-system')
const systemInfo = require('../logging/system-info');

const displayConfigBucket = 'risevision-display-notifications';
const productCodes = {
  "rpp": "c4b368be86245bf9501baaa6e0b00df9719869fd"
};

const subscriptions = {};
let displayId = null;

module.exports = {
  init() {
    viewerMessaging.on('licensing-request', sendLicensingUpdate);

    storageLocalMessaging.registerLocalListener(updateProductAuth);
    store.init();

    chrome.storage.onChanged.addListener(updateDisplayIdAndResubmitWatch);

    return viewerMessaging.viewerCanReceiveContent()
    .then(systemInfo.getDisplayId)
    .then(id=>displayId = id)
    .then(submitWatchForProductAuthChanges);
  }
}

function updateDisplayIdAndResubmitWatch(changes, area) {
  if (area !== 'local' || !changes.displayId) {return;}

  displayId = changes.displayId.newValue;
  submitWatchForProductAuthChanges();
}

function submitWatchForProductAuthChanges() {
  if (!displayId) {return;}

  const filePaths = Object.values(productCodes).map(code=>{
    return `${displayConfigBucket}/${displayId}/authorization/${code}.json`;
  });

  filePaths.forEach(filePath=>{
    console.log(`Submitting watch for ${filePath}`)
    storageMessaging.handleWatch({
      from: 'licensing',
      topic: 'WATCH',
      filePath
    });
  });
}

function updateProductAuth({topic, status, filePath, ospath} = {}) {
  if (topic !== 'FILE-UPDATE' || status !== 'CURRENT') {return}
  if (!filePath || !filePath.startsWith(displayConfigBucket)) {return}
  if (!aProductAuthFileWasChanged()) {return}

  const productCode = Object.values(productCodes).find(prodCode=>{
    return filePath.includes(prodCode);
  });

  return fileSystem.readCachedFileAsObject(ospath.split("/").pop())
  .then(obj=>{
    subscriptions[productCode] = obj.authorized;
    console.log(`Licensing authorization set to ${JSON.stringify(subscriptions)}`);
  })
  .then(sendLicensingUpdate)
  .catch(err=>{
    console.error(Error(err.message))
  });

  function aProductAuthFileWasChanged() {
    return Object.values(productCodes).some(prodCode=>{
      return filePath.includes(prodCode);
    });
  }
}

function sendLicensingUpdate() {
  const message = {
    from: 'licensing',
    topic: 'licensing-update',
    subscriptions
  };

  viewerMessaging.send(message);
}