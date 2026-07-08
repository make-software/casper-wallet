import { Tabs, tabs } from 'webextension-polyfill';

import { getUrlOrigin, hasHttpPrefix } from '@src/utils';

import { SdkEvent } from '@content/sdk-event';

export async function emitSdkEventToActiveTabs(
  callback: (tab: Tabs.Tab) => SdkEvent | undefined
) {
  const tabsList = await tabs.query({
    active: true
  });

  await Promise.all(
    tabsList.map(async tab => {
      if (tab.id) {
        // skip non http windows
        if (tab.url && hasHttpPrefix(tab.url)) {
          const action = callback(tab);
          if (action == null) {
            return;
          }
          try {
            await tabs.sendMessage(tab.id, action);
          } catch (error) {
            console.warn('Failed to send SDK event to tab: ' + tab.id, error);
          }
        }
      } else {
        console.error('Tab without id: ' + tab);
      }
    })
  );
}

export async function emitSdkEventToActiveTabsWithOrigin(
  origin: string,
  action: SdkEvent
) {
  if (!origin) {
    return;
  }

  const tabsList = await tabs.query({
    active: true
  });

  await Promise.all(
    tabsList.map(async tab => {
      if (tab.id) {
        // skip non http windows
        if (
          tab.url &&
          hasHttpPrefix(tab.url) &&
          getUrlOrigin(tab.url) === origin
        ) {
          try {
            await tabs.sendMessage(tab.id, action);
          } catch (error) {
            console.warn('Failed to send SDK event to tab: ' + tab.id, error);
          }
        }
      } else {
        console.error('Tab without id: ' + tab);
      }
    })
  );
}
