const path = require("path");

module.exports = {
  entry: {
    background: path.join(__dirname, "src", "background.js")
  },
  output: {
    path: path.join(__dirname, "app"),
    filename: "[name].bundle.js"
  }
};
