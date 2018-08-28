const presets = [
  [
    "@babel/env", {
      targets: {
        chrome: "42"
      },
      useBuiltIns: "usage"
    }
  ]
];

const plugins = ["transform-es2015-modules-commonjs"];

module.exports = {
  presets,
  plugins
};
