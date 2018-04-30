
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
  delete(filePath) {
    Reflect.deleteProperty(this.entries, filePath);
    return Promise.resolve();
  },
  getStale() {
    return Object.values(this.entries).filter((entry) => entry.status === 'STALE');
  }
};

const watchlist = {
  entries: {},
  _lastChanged: "0",
  put(entry) {
    const existing = this.entries[entry.filePath] || {};
    const newEntry = Object.assign(existing, entry);
    this.entries[entry.filePath] = newEntry
    return newEntry;
  },
  delete(filePath) {
    Reflect.deleteProperty(this.entries, filePath);
  },
  setLastChanged(lastChanged) {
    this._lastChanged = lastChanged;
  },
  lastChanged() {
    return this._lastChanged;
  },
  allEntries() {
    return Object.values(this.entries);
  }
};

function start() {
  console.log('database start to be implemented');
}

module.exports = {
  fileMetadata,
  watchlist,
  start
}
