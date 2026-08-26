const { NODE_ENV, BROWSER: browserEnvVar } = require('./utils/env');

const buildRootDir = ['test', 'production'].includes(NODE_ENV)
  ? 'build'
  : 'output';

const ExtensionBuildPath = {
  Chrome: `${buildRootDir}/chrome`,
  Firefox: `${buildRootDir}/firefox`,
  // Web-extension resources only. The Xcode project reads them from here; the
  // .app it produces is built and shipped from Xcode, never into this tree.
  Safari: `${buildRootDir}/safari`
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
  browserEnvVar,
  ManifestPath,
  isFirefox,
  isSafari,
  isChrome
};
