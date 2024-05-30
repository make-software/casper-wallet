import { tabs } from 'webextension-polyfill';

import { SdkMethod } from '@content/sdk-method';

// TODO: should use tab id to send back to specific tab
export async function sendSdkResponseToSpecificTab(action: SdkMethod) {
  const tabsList = await tabs.query({
    active: true
  });

  tabsList.forEach(async tab => {
    if (tab.id) {
      tabs.sendMessage(tab.id, action);
    } else {
      throw Error('Tab without id: ' + tab);
    }
  });
}
