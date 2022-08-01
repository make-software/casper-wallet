import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import { PurposeForOpening } from '@src/hooks';
import { openWindow } from '@background/window-manager';

import { PassToBackgroundAction } from '@background/remote-actions';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { disconnectAllAccountsFromSite } from '@popup/redux/vault/actions';
import { createInitStore } from '@popup/redux/utils';
import {
  selectIsSomeAccountConnectedToOrigin,
  selectVaultActiveAccount
} from '@popup/redux/vault/selectors';

const initStore = createInitStore(REDUX_STORAGE_KEY);

initStore().then(store => {
  Browser.runtime.onMessage.addListener(
    async (action: PassToBackgroundAction, sender: MessageSender) => {
      switch (action.type) {
        case 'request-connection':
          await openWindow(PurposeForOpening.ConnectToApp, action.payload);
          break;

        case 'disconnected-from-site':
          store.dispatch(
            disconnectAllAccountsFromSite({ appOrigin: action.payload })
          );
          break;

        case 'get-is-connected':
          return selectIsSomeAccountConnectedToOrigin(
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
          throw new Error('Unknown message type');
      }
    }
  );
});
