import Browser, { Runtime } from 'webextension-polyfill';

import {
  RemoteAction,
  passToBackgroundRequestConnection
} from './remote-actions';
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

function injectScript() {
  try {
    let jsPath = 'scripts/inpage.bundle.js';
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.src = Browser.runtime.getURL(jsPath);

    container.insertBefore(scriptTag, container.children[0]);
    scriptTag.onload = function () {
      container.removeChild(scriptTag);

      window.addEventListener('request-connection-from-app', async () => {
        await passToBackgroundRequestConnection();
      });
    };
  } catch (e) {
    console.error('CasperLabs provider injection failed.', e);
  }
}

window.onload = () => injectScript();
