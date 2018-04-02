
const fileMetadata = {
  entries: [],
  put(entry) {
    this.entries.push(entry);
  },

  get(filePath) {
    return this.entries.find((entry) => entry.filePath === filePath);
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
