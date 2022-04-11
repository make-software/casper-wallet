const { Browser } = require('selenium-webdriver');

const extensionName = 'CasperLabs Signer';
const browserEnvVar = process.env.BROWSER;

const ExtensionBuildPath = {
  Chrome: `build/${Browser.CHROME}`,
  Firefox: `build/${Browser.FIREFOX}`,
  Safari: `build/${Browser.SAFARI}/${extensionName}`
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
