import { runtime } from 'webextension-polyfill';

import { SdkMethod } from '@content/sdk-method';

// Message type for the UI→background forwarder. The UI no longer talks to the
// dapp tab directly; it hands the response to the background, which dedupes by
// `requestId` (first response for a request wins) and performs the actual
// `tabs.sendMessage`. See `handlers/sdk-response-to-tab.ts`.
export const SDK_RESPONSE_TO_TAB = 'CasperWallet:SdkResponseToTab';

export interface SdkResponseToTabMessage {
  type: typeof SDK_RESPONSE_TO_TAB;
  action: SdkMethod;
  tabId: number;
}

export function sendSdkResponseToSpecificTab(action: SdkMethod, tabId: number) {
  // Route through the background so it can dedupe by requestId atomically
  // (the background store is the single writer). Returns the sendMessage
  // promise so callers that `await` before closing the window still resolve.
  //
  // The `.catch` restores the always-resolves contract of the pre-reroute
  // implementation: callers (approve-connection / switch-account /
  // select-account) `await` this then `closeCurrentWindow()` with no try/catch,
  // so a rejection (e.g. the service worker torn down mid-flight) must NOT
  // propagate — otherwise the approval window would never close.
  return runtime
    .sendMessage({
      type: SDK_RESPONSE_TO_TAB,
      action,
      tabId
    } as SdkResponseToTabMessage)
    .catch(err =>
      console.warn('sendSdkResponseToSpecificTab: forward failed', err)
    );
}

export function parseRequestTabId(
  searchParams: URLSearchParams
): number | null {
  const raw = searchParams.get('tabId');

  if (!raw) return null;

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
