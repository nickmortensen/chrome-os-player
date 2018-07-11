const viewerMessaging = require('../messaging/viewer-messaging');
const storageLocalMessaging = require('../storage/messaging/local-messaging-helper');
const storageMessaging = require('../storage/messaging/messaging');
const fileSystem = require('../storage/file-system')
const systemInfo = require('../logging/system-info');

const displayConfigBucket = 'risevision-display-notifications';
const licenseFilePath = '/authorization/c4b368be86245bf9501baaa6e0b00df9719869fd.json'

const licenseData = {};
let displayId = null;

function updateIdAndResubmitWatch(changes, area) {
  if (area !== 'local' || !changes.displayId) {return;}

  displayId = changes.displayId.newValue;
  submitWatch();
}

function submitWatch() {
  if (!displayId) {return;}

  storageMessaging.handleWatch({
    from: 'licensing',
    topic: 'WATCH',
    filePath: `${displayConfigBucket}/${displayId}${licenseFilePath}`
  })
}

function updateLicensingWithNewGCSData({topic, status, filePath, ospath} = {}) {
  if (topic !== 'FILE-UPDATE' || status !== 'CURRENT') {return}
  if (!filePath || !filePath.startsWith(displayConfigBucket)) {return}
  if (!filePath.endsWith(`${displayId}${licenseFilePath}`)) {return}

  return fileSystem.readCachedFileAsObject(ospath.split("/").pop())
  .then(obj=>{
    licenseData.authorized = obj.authorized;
    console.log(`Licensing authorization set to ${licenseData.authorized}`);
  })
  .catch(err=>{
    console.error(Error(err.message))
  })
}

function licensingRequestResponse(product) {
  return ()=>{
    const message = {
      from: 'local-messaging',
      topic: `${product}-licensing-update`,
      isAuthorized: product === "rpp" ? licenseData.authorized : true
    };

    viewerMessaging.send(message);
  }
}

function init() {
  viewerMessaging.on('rpp-licensing-request', licensingRequestResponse('rpp'));
  viewerMessaging.on('storage-licensing-request', licensingRequestResponse('storage'));

  storageLocalMessaging.registerLocalListener(updateLicensingWithNewGCSData);
  chrome.storage.onChanged.addListener(updateIdAndResubmitWatch);

  return viewerMessaging.viewerCanReceiveContent()
  .then(systemInfo.getDisplayId)
  .then(id=>displayId = id)
  .then(submitWatch);
}

module.exports = {
  init
}
