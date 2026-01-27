import { getType } from 'typesafe-actions';
import { runtime } from 'webextension-polyfill';

import { initBringScript } from '@content/bring';

import { SdkEvent, sdkEvent } from './sdk-event';
import { CasperWalletEventType } from './sdk-event-type';
import {
  SdkMethod,
  SdkMethodEventType,
  isSDKMethod,
  sdkMethod
} from './sdk-method';

async function handleSdkMessage(message: SdkEvent | SdkMethod) {
  // delayed sdk request response
  if (isSDKMethod(message)) {
    switch (message.type) {
      case getType(sdkMethod.connectResponse):
      case getType(sdkMethod.connectError):
      case getType(sdkMethod.switchAccountResponse):
      case getType(sdkMethod.switchAccountError):
      case getType(sdkMethod.signError):
      case getType(sdkMethod.signResponse):
      case getType(sdkMethod.signMessageError):
      case getType(sdkMethod.signMessageResponse):
      case getType(sdkMethod.decryptMessageResponse):
      case getType(sdkMethod.decryptMessageError):
      case getType(sdkMethod.getActivePublicKeySupportsResponse):
      case getType(sdkMethod.getEncryptedMessageResponse):
      case getType(sdkMethod.getEncryptedMessageError):
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
    emitSdkEvent(message);
  }
}

// Proxy Wallet Events to connected site
function emitSdkEvent(message: SdkEvent) {
  let eventType: string;
  switch (message.type) {
    case getType(sdkEvent.connectedAccountEvent):
      eventType = CasperWalletEventType.Connected;
      break;

    case getType(sdkEvent.disconnectedAccountEvent):
      eventType = CasperWalletEventType.Disconnected;
      break;

    case getType(sdkEvent.changedConnectedAccountEvent):
      eventType = CasperWalletEventType.ActiveKeyChanged;
      break;

    case getType(sdkEvent.changedTab):
      eventType = CasperWalletEventType.TabChanged;
      break;

    case getType(sdkEvent.lockedEvent):
      eventType = CasperWalletEventType.Locked;
      break;

    case getType(sdkEvent.unlockedEvent):
      eventType = CasperWalletEventType.Unlocked;
      break;

    case getType(sdkEvent.changedActiveAccountSupportsEvent):
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
