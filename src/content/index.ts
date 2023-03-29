import browser from 'webextension-polyfill';

import {
  SdkMethodEventType,
  isSDKMethod,
  sdkMethod,
  SdkMethod
} from './sdk-method';
import { sdkEvent, SdkEvent } from './sdk-event';
import { getType } from 'typesafe-actions';
import { CasperWalletEventType } from './sdk-event-type';

async function handleSdkResponseOrEvent(
  message: SdkEvent | SdkMethod,
  sender: browser.Runtime.MessageSender
) {
  // Todo for Piotr: design convention for delayed sdk request responses
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
  // console.error('CONTENT EMIT SDK EVENT:', JSON.stringify(message));
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
function handleSdkRequest(e: Event) {
  const requestAction = (e as CustomEvent).detail;
  // validation
  if (!isSDKMethod(requestAction)) {
    throw Error(
      'Content: invalid sdk requestAction: ' + JSON.stringify(requestAction)
    );
  }

  browser.runtime
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
      throw Error('Content: sdk request send message: ' + err);
    });
}

// inject sdk script - idempotent, doesn't need cleanup
function injectSdkScript() {
  try {
    const documentHeadOrRoot = document.head || document.documentElement;
    const inpageScriptPath = 'sdk.bundle.js';

    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.src = browser.runtime.getURL(inpageScriptPath);
    scriptTag.onload = function () {
      documentHeadOrRoot.removeChild(scriptTag);
    };
    documentHeadOrRoot.insertBefore(scriptTag, documentHeadOrRoot.children[0]);
  } catch (e) {
    console.error('CasperWalletSdk injection failed. ', e);
  }
}

function init() {
  // console.log('CONTENT INIT');

  // idempotent, doesn't need cleanup
  injectSdkScript();

  browser.runtime.onMessage.addListener(handleSdkResponseOrEvent);
  window.addEventListener(SdkMethodEventType.Request, handleSdkRequest);
}

// cleanup logic
export const cleanupEventType = 'CasperWalletProvider:Cleanup';
window.dispatchEvent(new CustomEvent(cleanupEventType));
function cleanup() {
  // console.error('CONTENT CLEANUP');
  document.removeEventListener(cleanupEventType, cleanup);

  browser.runtime.onMessage.removeListener(handleSdkResponseOrEvent);
  window.removeEventListener(SdkMethodEventType.Request, handleSdkRequest);
}
window.addEventListener(cleanupEventType, cleanup);

init();
