import browser from 'webextension-polyfill';

import { WalletRuntimeEvent } from '@content/wallet-runtime-event';

export const sendEventToCurrentActiveTab = (action: WalletRuntimeEvent) => {
  browser.tabs
    .query({
      currentWindow: true,
      active: true
    })
    .then(tab => {
      if (tab[0]?.id) {
        browser.tabs.sendMessage(tab[0].id, action);
      } else {
        throw Error('Event error: ' + tab);
      }
    });
};
