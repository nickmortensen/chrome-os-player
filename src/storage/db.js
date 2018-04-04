
const fileMetadata = {
  entries: {},
  put(entry = {}) {
    const existing = this.entries[entry.filePath] || {};
    const newEntry = Object.assign(existing, entry);
    this.entries[entry.filePath] = newEntry
    return newEntry;
  },

  get(filePath) {
    return this.entries[filePath];
  },

  getStale() {
    return Object.values(this.entries).filter((entry) => entry.status === 'STALE');
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
