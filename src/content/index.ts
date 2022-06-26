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

    // const tabs = await Browser.tabs.query({
    //   active: true,
    //   currentWindow: true
    // });
    //
    // await Browser.tabs.sendMessage(tabs[0].id as number, {
    //   name: 'connected',
    //   detail: {
    //     isUnlocked: true,
    //     isConnected: true,
    //     activeKey: 'publicKey in hex'
    //   }
    // });

    default:
      throw new Error('Unknown message type');
  }
}

Browser.runtime.onMessage.addListener(handleMessage);
