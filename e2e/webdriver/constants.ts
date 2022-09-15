const { Browser } = require('selenium-webdriver');

export enum ElementState {
  Visible = 'visible',
  Detached = 'detached',
  Hidden = 'hidden'
}

// TODO: read pkg json
export const extensionName = 'Casper Wallet';

const distDir = 'dist';

export const ExtensionBuildPath = {
  Chrome: `${distDir}/${Browser.CHROME}`,
  Firefox: `${distDir}/${Browser.FIREFOX}`,
  Safari: `${distDir}/${Browser.SAFARI}/${extensionName}`
};
