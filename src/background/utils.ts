import browser from 'webextension-polyfill';

import { SdkEvent } from '@src/content/sdk-event';
import { getUrlOrigin, hasHttpPrefix } from '@src/utils';

export async function emitSdkEventToActiveTabs(
  callback: (tab: browser.Tabs.Tab) => SdkEvent | undefined
) {
  const tabs = await browser.tabs.query({
    active: true
  });

  tabs.forEach(async tab => {
    if (tab.id) {
      // skip non http windows
      if (tab.url && hasHttpPrefix(tab.url)) {
        const action = callback(tab);
        if (action == null) {
          return;
        }
        console.log('EVENT::' + action.type + ' => ' + tab.url);
        browser.tabs.sendMessage(tab.id, action);
      }
    } else {
      throw Error('Tab without id: ' + tab);
    }
  });
}

export async function emitSdkEventToActiveTabsWithOrigin(
  origin: string,
  action: SdkEvent
) {
  if (!origin) {
    return;
  }

  const tabs = await browser.tabs.query({
    active: true
  });

  tabs.forEach(async tab => {
    if (tab.id) {
      // skip non http windows
      if (
        tab.url &&
        hasHttpPrefix(tab.url) &&
        getUrlOrigin(tab.url) === origin
      ) {
        console.log('EVENT::' + action.type + ' => ' + tab.url);
        browser.tabs.sendMessage(tab.id, action);
      }
    } else {
      throw Error('Tab without id: ' + tab);
    }
  });
}
