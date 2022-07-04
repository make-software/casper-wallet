import Browser, { Runtime } from 'webextension-polyfill';

import { RemoteAction } from './remote-actions';
import MessageSender = Runtime.MessageSender;

if (process.env.NODE_ENV === 'development') {
  console.log('Must reload extension for modifications to take effect.');
}

async function handleMessage(action: RemoteAction, sender: MessageSender) {
  switch (action.type) {
    case 'get-active-tab-origin':
      const { origin } = window.location;
      return origin;

    case 'send-connect-status':
      const signerConnectedEvent = new CustomEvent('signer:connected', {
        detail: action.payload
      });
      window.dispatchEvent(signerConnectedEvent);

      break;
    default:
      throw new Error('Unknown message type');
  }
}

Browser.runtime.onMessage.addListener(handleMessage);
