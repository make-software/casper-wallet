import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import { PurposeForOpening } from '@src/hooks';
import { openWindow } from '@background/window-manager';

import { PassToBackgroundAction } from '@background/remote-actions';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { disconnectFromApp } from '@popup/redux/vault/actions';
import { createInitStore } from '@popup/redux/utils';

const initStore = createInitStore(REDUX_STORAGE_KEY);

initStore().then(store => {
  Browser.runtime.onMessage.addListener(
    async (action: PassToBackgroundAction, sender: MessageSender) => {
      switch (action.type) {
        case 'request-connection':
          await openWindow(PurposeForOpening.ConnectToApp, action.payload);
          break;

        case 'disconnected-from-app':
          store.dispatch(disconnectFromApp({ appOrigin: action.payload }));
          break;
        default:
          throw new Error('Unknown message type');
      }
    }
  );
});
