import browser from 'webextension-polyfill';

import { SdkEvent } from '@src/content/sdk-event';

export async function emitSdkEventToAllActiveTabs(action: SdkEvent) {
  const tabs = await browser.tabs.query({
    active: true
  });

  tabs.forEach(async tab => {
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, action);
    } else {
      throw Error('Tab without id: ' + tab);
    }
  });
}
