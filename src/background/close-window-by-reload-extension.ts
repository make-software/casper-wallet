import { runtime, tabs } from 'webextension-polyfill';

import { isFirefoxBuild, isSafariBuild } from '@src/utils';

// window.close() may only be called on windows opened by a script, so Safari and
// Firefox fall back to runtime.reload() — WARNING: IT RELOADS ENTIRE EXTENSION.
export function closeWindowByReloadExtension() {
  if (isSafariBuild) {
    tabs.create({ url: 'onboarding.html', active: true });
    runtime.reload();
    return;
  }
  if (isFirefoxBuild) {
    runtime.reload();
    return;
  }
  window.close();
  tabs.create({ url: 'onboarding.html', active: true });
}
