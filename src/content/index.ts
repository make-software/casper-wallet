import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import { passToBackgroundRequestConnection } from '@background/remote-actions';

import { RemoteAction } from './remote-actions';

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

    case 'send-active-account-changed':
      const signerActiveAccountChanged = new CustomEvent(
        'signer:activeKeyChanged',
        {
          detail: action.payload
        }
      );
      window.dispatchEvent(signerActiveAccountChanged);
      break;
    default:
      throw new Error('Content script: Unknown message type');
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
        const { origin } = window.location;
        await passToBackgroundRequestConnection(origin);
      });
    };
  } catch (e) {
    console.error('CasperLabs provider injection failed.', e);
  }
}

window.onload = () => injectScript();
