const { Browser } = require('selenium-webdriver');
const { NODE_ENV, BROWSER: browserEnvVar } = require('./utils/env');

const extensionName = 'Casper Wallet';
const buildRootDir =
  NODE_ENV === 'production' || NODE_ENV === 'test' ? 'build' : 'output';

const ExtensionBuildPath = {
  Chrome: `${buildRootDir}/${Browser.CHROME}`,
  Firefox: `${buildRootDir}/${Browser.FIREFOX}`,
  Safari: `${buildRootDir}/${Browser.SAFARI}/${extensionName}`
};

const ManifestPath = {
  v3: 'src/manifest.v3.json',
  v2: 'src/manifest.v2.json'
};

const isSafari = browserEnvVar && browserEnvVar === Browser.SAFARI;
const isChrome = browserEnvVar && browserEnvVar === Browser.CHROME;
const isFirefox = browserEnvVar && browserEnvVar === Browser.FIREFOX;

module.exports = {
  ExtensionBuildPath,
  extensionName,
  browserEnvVar,
  ManifestPath,
  Browser,
  isFirefox,
  isSafari,
  isChrome
};
