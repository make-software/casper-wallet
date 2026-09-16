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

// The private port handed to the page-world SDK during the handshake; both the
// direct and the delayed background response ride it back, never the window bus.
let activePort: MessagePort | null = null;

// Pinning the exact request-direction type strings means a forged `*:Response` /
// `*:Error` envelope or a redux action can never be relayed to the background.
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
        if (activePort == null) {
          // Log type + requestId only — these payloads carry signatureHex /
          // encryptedMessage. A silent drop leaves the dapp hanging until its timeout.
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

// `port2` is transferred to the page-world SDK during the handshake, so only the
// holder of that port can drive this path; there is no window listener to forge.
function establishSdkPort() {
  const channel = new MessageChannel();

  channel.port1.onmessage = event => {
    const requestAction = event.data;
    if (
      !isSDKMethod(requestAction) ||
      !SDK_REQUEST_TYPES.has(requestAction.type)
    ) {
      return;
    }

    runtime
      .sendMessage(requestAction)
      .then(message => {
        if (isSDKMethod(message)) {
          channel.port1.postMessage(message);
        }
      })
      .catch(err => {
        console.error('Content: sdk request received error: ', err);
        // Reject the SDK's promise now, instead of letting the dapp wait out the
        // per-request timeout (up to 30 min).
        channel.port1.postMessage({
          type: `${requestAction.type}:Error`,
          payload: err instanceof Error ? err : Error(String(err)),
          meta: requestAction.meta,
          error: true
        });
      });
  };

  activePort = channel.port1;

  // origin-scoped so the port is never delivered cross-origin
  try {
    window.postMessage({ type: SDK_HANDSHAKE_TYPE }, window.location.origin, [
      channel.port2
    ]);
  } catch (e) {
    // An opaque-origin document (CSP `sandbox`) reports its origin as the string
    // "null", which is not a valid `targetOrigin`, so `postMessage` throws.
    console.error('CasperWalletSdk handshake failed. ', e);
  }
}

function injectSdkScript() {
  try {
    const documentHeadOrRoot = document.head || document.documentElement;
    const inpageScriptPath = 'sdk.bundle.js';

    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.src = runtime.getURL(inpageScriptPath);
    scriptTag.onload = function () {
      documentHeadOrRoot.removeChild(scriptTag);
      // The SDK bundle has registered its handshake listener by now, so handing
      // over the port here closes the race a synchronous post would open.
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
