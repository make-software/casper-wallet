import { Tabs, tabs } from 'webextension-polyfill';

import { getUrlOrigin, hasHttpPrefix } from '@src/utils';

import { SdkEvent } from '@content/sdk-event';
import { SdkMethod } from '@content/sdk-method';

export async function emitSdkEventToActiveTabs(
  callback: (tab: Tabs.Tab) => SdkEvent | undefined
) {
  const tabsList = await tabs.query({
    active: true
  });

  await Promise.all(
    tabsList.map(async tab => {
      if (tab.id) {
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

// Returns the number of tabs the action was SUCCESSFULLY delivered to;
// `handleSdkResponseToTab` uses the count to decide whether the dapp got it.
export async function emitSdkEventToActiveTabsWithOrigin(
  origin: string,
  // A method **response** may also be broadcast here as a same-origin fallback.
  action: SdkEvent | SdkMethod,
  // Response delivery passes the frame that made the request; SDK events pass
  // nothing and keep reaching every frame, which is what an event is for.
  frameId?: number
): Promise<number> {
  if (!origin) {
    return 0;
  }

  const tabsList = await tabs.query({
    active: true
  });

  let delivered = 0;

  await Promise.all(
    tabsList.map(async tab => {
      if (tab.id) {
        if (
          tab.url &&
          hasHttpPrefix(tab.url) &&
          getUrlOrigin(tab.url) === origin
        ) {
          try {
            await (frameId == null
              ? tabs.sendMessage(tab.id, action)
              : tabs.sendMessage(tab.id, action, { frameId }));
            delivered += 1;
          } catch (error) {
            console.warn('Failed to send SDK event to tab: ' + tab.id, error);
          }
        }
      } else {
        console.error('Tab without id: ' + tab);
      }
    })
  );

  return delivered;
}
