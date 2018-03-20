const fileMetadata = {
  put(entry) {
    console.log('to be implemented', entry);
    return Promise.resolve();
  }
};

const watchlist = {
  put(entry) {
    console.log('to be implemented', entry);
    return Promise.resolve();
  }
};

module.exports = {
  fileMetadata,
  watchlist
}
