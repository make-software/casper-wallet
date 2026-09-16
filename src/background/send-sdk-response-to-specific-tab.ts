import { runtime } from 'webextension-polyfill';

import { SdkMethod } from '@content/sdk-method';

// Message type for the UI→background forwarder: the UI hands the response to the
// background, which dedupes by `requestId` and does the `tabs.sendMessage`.
export const SDK_RESPONSE_TO_TAB = 'CasperWallet:SdkResponseToTab';

export interface SdkResponseToTabMessage {
  type: typeof SDK_RESPONSE_TO_TAB;
  action: SdkMethod;
  tabId: number;
}

export function sendSdkResponseToSpecificTab(action: SdkMethod, tabId: number) {
  // Routed through the background so it dedupes by requestId atomically. Must
  // always resolve: callers `closeCurrentWindow()` right after awaiting it.
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
