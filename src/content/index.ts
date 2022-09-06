import browser from 'webextension-polyfill';

import { sdkMessageProxyEvents, isSDKMessage } from './sdk-message';
import { sdkEvent, SdkEvent } from './sdk-event';
import { getType } from 'typesafe-actions';
import { activeOriginChanged } from '@src/background/redux/vault/actions';

// Sync activeOrigin of active tab with store
function syncActiveOriginWithStore() {
  let activeOrigin: string | null = null;
  if (document.visibilityState === 'visible') {
    activeOrigin = window.location.origin;
  }
  console.error('CONTENT ACTIVE ORIGIN:', activeOrigin);
  if (chrome.runtime?.id) {
    browser.runtime
      .sendMessage(activeOriginChanged(activeOrigin))
      .catch(err => {
        console.error('Content: sync active origin:', err);
      });
  } else {
    // cleanup();
    // init();
  }
}

// Proxy Wallet Events to connected site
function emitSdkEvent(action: SdkEvent) {
  console.error('CONTENT EMIT SDK EVENT:', JSON.stringify(action));
  let eventType: string;
  switch (action.type) {
    case getType(sdkEvent.connectedActiveAccountEvent):
      eventType = 'signer:connected';
      break;

    case getType(sdkEvent.disconnectedActiveAccountEvent):
      eventType = 'signer:disconnected';
      break;

    case getType(sdkEvent.changedActiveConnectedAccountEvent):
      eventType = 'signer:activeKeyChanged';
      break;

    default:
      throw Error(
        'Content: emit sdk event unknown action: ' + JSON.stringify(action)
      );
  }

  const event = new CustomEvent(eventType, {
    detail: JSON.stringify(action.payload)
  });
  window.dispatchEvent(event);
}

// SDK Message proxy to the backend
async function handleSdkRequest(e: Event) {
  const requestAction = (e as CustomEvent).detail;
  // validation
  if (!isSDKMessage(requestAction)) {
    throw Error(
      'Content: invalid sdk requestAction.' + JSON.stringify(requestAction)
    );
  }
  const responseAction = await browser.runtime
    .sendMessage(requestAction)
    .catch(err => {
      throw Error('Content: sdk request send message:' + err);
    });
  // validation
  if (!isSDKMessage(responseAction)) {
    throw Error(
      'Content: invalid sdk responseAction.' + JSON.stringify(responseAction)
    );
  }
  window.dispatchEvent(
    new CustomEvent(sdkMessageProxyEvents.SDKResponseAction, {
      detail: JSON.stringify(responseAction)
    })
  );
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
    console.error('CasperWalletSdk injection failed.', e);
  }
}

function init() {
  console.error('CONTENT INIT');

  // idempotent, doesn't need cleanup
  injectSdkScript();

  window.addEventListener('load', syncActiveOriginWithStore);
  window.addEventListener('visibilitychange', syncActiveOriginWithStore);
  window.addEventListener('focus', syncActiveOriginWithStore);
  window.addEventListener('blur', syncActiveOriginWithStore);

  browser.runtime.onMessage.addListener(emitSdkEvent);
  window.addEventListener(
    sdkMessageProxyEvents.SDKRequestAction,
    handleSdkRequest
  );
}

// cleanup logic
export const cleanupEventType = 'CasperWalletProvider:Cleanup';
window.dispatchEvent(new CustomEvent(cleanupEventType));
function cleanup() {
  console.error('CONTENT CLEANUP');
  document.removeEventListener(cleanupEventType, cleanup);

  window.removeEventListener('load', syncActiveOriginWithStore);
  window.removeEventListener('visibilitychange', syncActiveOriginWithStore);
  window.removeEventListener('focus', syncActiveOriginWithStore);
  window.removeEventListener('blur', syncActiveOriginWithStore);

  browser.runtime.onMessage.removeListener(emitSdkEvent);
  window.removeEventListener(
    sdkMessageProxyEvents.SDKRequestAction,
    handleSdkRequest
  );
}
window.addEventListener(cleanupEventType, cleanup);

init();
