const serviceUrl = 'https://www.googleapis.com/storage/v1/b/BUCKETNAME/o/FILEPATH';

function fetchJson(bucketName, filePath) {
  const url = serviceUrl.replace("BUCKETNAME", bucketName).replace("FILEPATH", encodeURIComponent(filePath));
  return fetch(`${url}?alt=media&ifGenerationNotMatch=-1`).then(response => response.json());
}

module.exports = {
  fetchJson
}
