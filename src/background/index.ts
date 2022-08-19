import browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import { PurposeForOpening } from '@src/hooks';

import { BackgroundAction } from '@background/remote-actions';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { disconnectAllAccountsFromSite } from '@popup/redux/vault/actions';
import { createInitStore } from '@popup/redux/utils';
import {
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultActiveAccount
} from '@popup/redux/vault/selectors';

import { openWindow } from '@background/open-window';

chrome.runtime.onInstalled.addListener(() => {
  // this will run on installation or update so
  // first clear previous rules, then register new rules
});

const initStore = createInitStore(REDUX_STORAGE_KEY);
initStore().then(store => {
  browser.runtime.onMessage.addListener(
    async (action: BackgroundAction, sender: MessageSender) => {
      switch (action.type) {
        case 'request-connection':
          await openWindow({
            purposeForOpening: PurposeForOpening.ConnectToApp,
            origin: action.payload
          });
          break;

        case 'disconnected-from-site':
          store.dispatch(
            disconnectAllAccountsFromSite({ siteOrigin: action.payload })
          );
          break;

        case 'get-is-connected':
          return selectIsAnyAccountConnectedWithOrigin(
            store.getState(),
            action.payload
          );

        case 'get-active-public-key':
          const activeAccount = selectVaultActiveAccount(store.getState());
          return activeAccount ? activeAccount.publicKey : null;

        case 'get-version':
          // TODO: implement version from manifest
          return '1.4.12';

        default:
          throw new Error(
            'Background: Unknown message type: ' + JSON.stringify(action)
          );
      }
    }
  );
});
