import { runtime } from 'webextension-polyfill';

import { initBringScript } from '@content/bring';

import { SdkEvent, sdkEvent } from './sdk-event';
import { CasperWalletEventType } from './sdk-event-type';
import { SdkMethodEventType, isSDKMethod, sdkMethod } from './sdk-method';

async function handleSdkMessage(message: unknown) {
  // delayed sdk request response
  if (isSDKMethod(message)) {
    switch (message.type) {
      case sdkMethod.connectResponse.type:
      case sdkMethod.connectError.type:
      case sdkMethod.switchAccountResponse.type:
      case sdkMethod.switchAccountError.type:
      case sdkMethod.signError.type:
      case sdkMethod.signResponse.type:
      case sdkMethod.signMessageError.type:
      case sdkMethod.signMessageResponse.type:
      case sdkMethod.signTypedDataResponse.type:
      case sdkMethod.signTypedDataError.type:
      case sdkMethod.decryptMessageResponse.type:
      case sdkMethod.decryptMessageError.type:
      case sdkMethod.encryptMessageResponse.type:
      case sdkMethod.encryptMessageError.type:
      case sdkMethod.getActivePublicKeySupportsResponse.type:
        window.dispatchEvent(
          new CustomEvent(SdkMethodEventType.Response, {
            detail: JSON.stringify(message)
          })
        );
        return;

      default:
        throw Error(
          'Content: handleOnMessage unknown sdk message: ' +
            JSON.stringify(message)
        );
    }
  } else {
    emitSdkEvent(message as SdkEvent);
  }
}

// Proxy Wallet Events to connected site
function emitSdkEvent(message: SdkEvent) {
  let eventType: string;
  switch (message.type) {
    case sdkEvent.connectedAccountEvent.type:
      eventType = CasperWalletEventType.Connected;
      break;

    case sdkEvent.disconnectedAccountEvent.type:
      eventType = CasperWalletEventType.Disconnected;
      break;

    case sdkEvent.changedConnectedAccountEvent.type:
      eventType = CasperWalletEventType.ActiveKeyChanged;
      break;

    case sdkEvent.changedTab.type:
      eventType = CasperWalletEventType.TabChanged;
      break;

    case sdkEvent.lockedEvent.type:
      eventType = CasperWalletEventType.Locked;
      break;

    case sdkEvent.unlockedEvent.type:
      eventType = CasperWalletEventType.Unlocked;
      break;

    case sdkEvent.changedActiveAccountSupportsEvent.type:
      eventType = CasperWalletEventType.ActiveKeySupportsChanged;
      break;

    default:
      throw Error(
        'Content: emit sdk event unknown action: ' + JSON.stringify(message)
      );
  }

  const event = new CustomEvent(eventType, {
    detail: JSON.stringify(message.payload)
  });
  window.dispatchEvent(event);
}

// SDK Message proxy to the backend
function handleSdkRequestEvent(e: Event) {
  const requestAction = (e as CustomEvent).detail;
  // validation
  if (!isSDKMethod(requestAction)) {
    throw Error(
      'Content: invalid sdk requestAction: ' + JSON.stringify(requestAction)
    );
  }

  runtime
    .sendMessage(requestAction)
    .then(message => {
      // if valid message send back response
      if (isSDKMethod(message)) {
        window.dispatchEvent(
          new CustomEvent(SdkMethodEventType.Response, {
            detail: JSON.stringify(message)
          })
        );
      }
    })
    .catch(err => {
      throw Error('Content: sdk request received error: ' + err);
    });
}

// inject sdk script - idempotent, doesn't need cleanup
function injectSdkScript() {
  try {
    const documentHeadOrRoot = document.head || document.documentElement;
    const inpageScriptPath = 'sdk.bundle.js';

    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.src = runtime.getURL(inpageScriptPath);
    scriptTag.onload = function () {
      documentHeadOrRoot.removeChild(scriptTag);
    };
    documentHeadOrRoot.insertBefore(scriptTag, documentHeadOrRoot.children[0]);
  } catch (e) {
    console.error('CasperWalletSdk injection failed. ', e);
  }
}

function init() {
  // idempotent, doesn't need cleanup
  injectSdkScript();

  runtime.onMessage.addListener(handleSdkMessage);
  window.addEventListener(SdkMethodEventType.Request, handleSdkRequestEvent);
}

// cleanup logic
export const cleanupEventType = 'CasperWalletProvider:Cleanup';
window.dispatchEvent(new CustomEvent(cleanupEventType));
function cleanup() {
  document.removeEventListener(cleanupEventType, cleanup);

  runtime.onMessage.removeListener(handleSdkMessage);
  window.removeEventListener(SdkMethodEventType.Request, handleSdkRequestEvent);
}
window.addEventListener(cleanupEventType, cleanup);

init();

initBringScript();
