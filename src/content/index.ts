import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import {
  requestConnection,
  disconnectFromSite,
  getActivePublicKey,
  getIsConnected,
  getVersion
} from '@background/remote-actions';

import { RemoteAction } from './remote-actions';

if (process.env.NODE_ENV === 'development') {
  console.log('Must reload extension for modifications to take effect.');
}

async function handleMessage(action: RemoteAction, sender: MessageSender) {
  switch (action.type) {
    case 'fetch-active-tab-origin':
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

    case 'send-disconnect-account':
      const signerDisconnectAccount = new CustomEvent('signer:disconnected', {
        detail: action.payload
      });
      window.dispatchEvent(signerDisconnectAccount);
      break;

    default:
      throw new Error(
        'Content: Unknown message type: ' + JSON.stringify(action)
      );
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

      function sendReplyMessage(message: string, value: boolean | string) {
        window.postMessage({
          type: 'reply',
          message,
          value
        });
      }

      window.addEventListener('message', async e => {
        if (e.data.type !== 'request') {
          return;
        }

        switch (e.data.message) {
          case 'request-connection-from-site':
            await requestConnection(window.location.origin);
            break;

          case 'disconnected-from-site':
            await disconnectFromSite(window.location.origin);
            break;

          case 'get-is-connected':
            const isConnected = await getIsConnected(window.location.origin);
            sendReplyMessage('get-is-connected', isConnected);
            break;

          case 'get-active-public-key':
            const activePublicKey = await getActivePublicKey();
            sendReplyMessage('get-active-public-key', activePublicKey);
            break;

          case 'get-version':
            const version = await getVersion();
            sendReplyMessage('get-version', version);
            break;

          default:
            throw new Error(
              'Injected: Unknown message type: ' + JSON.stringify(e.data)
            );
        }
      });
    };
  } catch (e) {
    console.error('CasperLabs provider injection failed.', e);
  }
}

injectScript();
