import browser from 'webextension-polyfill';

import { SdkMethod } from '@content/sdk-method';

// TODO: should use tab id to send back to specific tab
export async function sendSdkResponseToSpecificTab(action: SdkMethod) {
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
