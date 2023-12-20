import browser from 'webextension-polyfill';

import { isFirefoxBuild, isSafariBuild } from '@src/utils';

// It's hacky for Safari browser => browser.runtime.reload();
// window.close() method can only be called on windows that were opened by a script using the Window.open() method.
// If the window was > not opened by a script, an error similar to this one appears in the console:
// Scripts may not close windows that were not opened by script
// WARNING: IT WILL RELOAD ENTIRE EXTENSION
export function closeWindowByReloadExtension() {
  if (isSafariBuild) {
    browser.tabs.create({ url: 'onboarding.html', active: true });
    browser.runtime.reload();
    return;
  }
  if (isFirefoxBuild) {
    browser.runtime.reload();
    return;
  }
  window.close();
  browser.tabs.create({ url: 'onboarding.html', active: true });
}
