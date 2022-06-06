const fs = require('fs');
const path = require('path');

const {
  ExtensionBuildPath,
  isChrome,
  isSafari,
  isFirefox
} = require('../constants');

function getExtensionBuildAbsolutePath() {
  if (isChrome) {
    return path.join(__dirname, '../', ExtensionBuildPath.Chrome);
  } else if (isFirefox) {
    return path.join(__dirname, '../', ExtensionBuildPath.Firefox);
  } else if (isSafari) {
    return path.join(__dirname, '../', ExtensionBuildPath.Safari);
  }
  throw new Error('Unknown browser passed');
}

function cleanUpBuildDir() {
  const extensionBuildAbsolutePath = getExtensionBuildAbsolutePath();
  fs.rmSync(extensionBuildAbsolutePath, { recursive: true, force: true });
}

module.exports = {
  getExtensionBuildAbsolutePath,
  cleanUpBuildDir
};
