import { runtime } from 'webextension-polyfill';

import { initBringScript } from '@content/bring';

import { SDK_HANDSHAKE_TYPE } from './sdk-channel';
import { SdkEvent, sdkEvent } from './sdk-event';
import { CasperWalletEventType } from './sdk-event-type';
import { isSDKMethod, sdkMethod } from './sdk-method';
import {
  unknownSdkEventError,
  unknownSdkMessageError
} from './unknown-message-errors';

// The private port handed to the page-world SDK during the handshake. Both the
// direct `runtime.sendMessage` response and the delayed `runtime.onMessage`
// response ride this port back to the SDK — never the public window bus.
let activePort: MessagePort | null = null;

// Only genuine page → background SDK *requests* may cross the relay. Pinning the
// exact request-direction type strings (instead of trusting `isSDKMethod`'s
// shape check alone) means a forged `*:Response`/`*:Error` envelope or a redux
// action `type` can never be relayed to the background — independent of the
// background router's branch ordering (defense-in-depth for P0.2).
const SDK_REQUEST_TYPES: ReadonlySet<string> = new Set([
  sdkMethod.connectRequest.type,
  sdkMethod.switchAccountRequest.type,
  sdkMethod.signRequest.type,
  sdkMethod.signMessageRequest.type,
  sdkMethod.signTypedDataRequest.type,
  sdkMethod.encryptMessageRequest.type,
  sdkMethod.decryptMessageRequest.type,
  sdkMethod.disconnectRequest.type,
  sdkMethod.isConnectedRequest.type,
  sdkMethod.getActivePublicKeyRequest.type,
  sdkMethod.getVersionRequest.type,
  sdkMethod.getActivePublicKeySupportsRequest.type
]);

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
        // route the delayed response over the private port (not a window event)
        if (activePort == null) {
          // No port: cleanup() ran on an extension reload, or this response
          // raced the handshake. Dropping it silently can discard a deploy the
          // user just signed and leave the dapp hanging until its own timeout.
          // SECURITY: type + requestId only — the payload of these envelopes
          // carries signatureHex / encryptedMessage.
          console.error(
            'Content: dropped a delayed SDK response, no active port:',
            message.type,
            message.meta.requestId
          );
          return;
        }

        activePort.postMessage(message);
        return;

      default:
        throw unknownSdkMessageError(message);
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
      throw unknownSdkEventError(message);
  }

  const event = new CustomEvent(eventType, {
    detail: JSON.stringify(message.payload)
  });
  window.dispatchEvent(event);
}

// SDK Message proxy to the backend, over the private MessageChannel.
//
// The content script keeps `port1`; requests that arrive on it are shaped-checked
// with `isSDKMethod` and forwarded to the background. Direct responses ride back
// on the same port. `port2` is transferred to the page-world SDK during the
// handshake, so only the holder of that port (the injected SDK) can drive this
// path — a script that forges the old `Request` window CustomEvent gets nothing,
// because that window listener no longer exists.
function establishSdkPort() {
  const channel = new MessageChannel();

  channel.port1.onmessage = event => {
    const requestAction = event.data;
    // only genuine SDK requests may cross into the background
    if (
      !isSDKMethod(requestAction) ||
      !SDK_REQUEST_TYPES.has(requestAction.type)
    ) {
      return;
    }

    runtime
      .sendMessage(requestAction)
      .then(message => {
        // if valid message send back response over the private port
        if (isSDKMethod(message)) {
          channel.port1.postMessage(message);
        }
      })
      .catch(err => {
        console.error('Content: sdk request received error: ', err);
        // The send failed (e.g. the MV3 service-worker restart race). Tell the
        // SDK now over the private port so its promise rejects immediately,
        // instead of letting the dapp wait out the per-request timeout (up to
        // 30 min). `error: true` + the request's `meta` route it back to the
        // right pending promise on the SDK side.
        channel.port1.postMessage({
          type: `${requestAction.type}:Error`,
          payload: err instanceof Error ? err : Error(String(err)),
          meta: requestAction.meta,
          error: true
        });
      });
  };

  activePort = channel.port1;

  // hand port2 to the page-world SDK; origin-scoped so it is never delivered
  // cross-origin.
  try {
    window.postMessage({ type: SDK_HANDSHAKE_TYPE }, window.location.origin, [
      channel.port2
    ]);
  } catch (e) {
    // An opaque-origin document (e.g. a page served with a CSP `sandbox`
    // header) reports `window.location.origin` as the string "null", which is
    // not a valid `targetOrigin` — `postMessage` throws. Match the injection
    // error handling in `injectSdkScript` rather than letting the exception
    // escape this `onload` handler uncaught.
    console.error('CasperWalletSdk handshake failed. ', e);
  }
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
      // The SDK bundle has now evaluated and registered its handshake `message`
      // listener, so handing over the port here closes the race that posting
      // synchronously from `init()` (before the SDK loads) would open.
      establishSdkPort();
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
}

// cleanup logic
export const cleanupEventType = 'CasperWalletProvider:Cleanup';
window.dispatchEvent(new CustomEvent(cleanupEventType));
function cleanup() {
  window.removeEventListener(cleanupEventType, cleanup);

  runtime.onMessage.removeListener(handleSdkMessage);
  // tear down the private port so a superseded instance can't keep proxying
  activePort?.close();
  activePort = null;
}
window.addEventListener(cleanupEventType, cleanup);

init();

initBringScript();
