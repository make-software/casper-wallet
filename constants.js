const { NODE_ENV, BROWSER: browserEnvVar } = require('./utils/env');

const extensionName = 'Casper Wallet';
const buildRootDir = ['test', 'production'].includes(NODE_ENV)
  ? 'build'
  : 'output';

const ExtensionBuildPath = {
  Chrome: `${buildRootDir}/chrome`,
  Firefox: `${buildRootDir}/firefox`,
  Safari: `${buildRootDir}/safari/${extensionName}`
};

const ManifestPath = {
  v3: 'src/manifest.v3.json',
  v2: 'src/manifest.v2.json',
  v2_Safari: 'src/manifest.v2.safari.json'
};

const isSafari = browserEnvVar && browserEnvVar === 'safari';
const isChrome = browserEnvVar && browserEnvVar === 'chrome';
const isFirefox = browserEnvVar && browserEnvVar === 'firefox';

module.exports = {
  ExtensionBuildPath,
  extensionName,
  browserEnvVar,
  ManifestPath,
  isFirefox,
  isSafari,
  isChrome
};
