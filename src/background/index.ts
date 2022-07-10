import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import { PurposeForOpening } from '@src/hooks';
import { openWindow } from '@background/window-manager';

import { PassToBackgroundAction } from '@content/remote-actions';

Browser.runtime.onMessage.addListener(
  async (action: PassToBackgroundAction, sender: MessageSender) => {
    switch (action.type) {
      case 'request-connection':
        await openWindow(PurposeForOpening.ConnectToApp, action.payload);
        break;
      default:
        throw new Error('Unknown message type');
    }
  }
);
