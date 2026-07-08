import { tabs } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { selectRequestStatus } from '@background/redux/windowManagement/selectors';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';

import { HandlerResult } from './types';

// Server-side dedupe of SDK responses (P0.5 root cause). The signature UI pages
// used to `tabs.sendMessage` the response to the dapp tab directly and guard
// double-sends with a per-page `responseSentRef` (fragile: per instance, lost on
// reload). Now every response is forwarded here and deduped by `requestId`: the
// FIRST response for a request wins, later ones are dropped — atomically,
// because the background store is the single writer.
//
// CRITICAL: drop ONLY when the request is already 'responded', NEVER on 'closed'.
// `handleCancel` fires on `beforeunload` and sends its response just before the
// window unloads; the `windows.onRemoved` listener then dispatches
// `windowClosed()` (marking still-open requests 'closed'). These race. Dropping
// on 'closed' would suppress a legitimate beforeunload-cancel for a window that
// closed WITHOUT a prior response (dapp left hanging). Dropping only on
// 'responded' kills the real duplicate (a cancel after a successful sign, where
// the sign already set 'responded') without ever suppressing a first response.
export async function handleSdkResponseToTab(
  message: unknown,
  store: MainStore
): Promise<HandlerResult> {
  const candidate = message as Partial<SdkResponseToTabMessage> | undefined;

  if (candidate?.type !== SDK_RESPONSE_TO_TAB) {
    return { handled: false };
  }

  const { action, tabId } = candidate as SdkResponseToTabMessage;
  const requestId = action?.meta?.requestId;

  // Dedupe: first response for this requestId wins. Drop ONLY on 'responded'
  // (see the race rationale above) — never on 'closed'.
  if (
    requestId != null &&
    selectRequestStatus(store.getState(), requestId) === 'responded'
  ) {
    // Drop the duplicate — it never reaches the tab. Respond so the forwarding
    // UI's `runtime.sendMessage` promise still resolves (some callers await it
    // before closing the window).
    return { handled: true, response: undefined };
  }

  if (!Number.isInteger(tabId) || tabId < 0) {
    // Nothing was sent — do NOT mark responded (a valid retry must still deliver).
    console.error('handleSdkResponseToTab: invalid tabId', tabId);
    return { handled: true, response: undefined };
  }

  // Mark responded OPTIMISTICALLY, BEFORE the await. `runtime.onMessage`
  // handlers interleave at every `await`, so two near-simultaneous responses
  // for the same requestId (the P0.5 repro: handleSign sends, then
  // closeCurrentWindow → beforeunload → handleCancel sends) would BOTH read
  // status `undefined` if we marked after the send — and both would reach the
  // dapp. Dispatching synchronously here (before yielding the event loop) means
  // a second message processed during the first's in-flight send reads
  // 'responded' and drops. Trade-off: on a genuine delivery failure the request
  // stays 'responded' and any retry is dropped — acceptable, since delivery
  // failure is already terminal (no retry path) and deterministic dedup is the goal.
  if (requestId != null) {
    store.dispatch(windowRequestResponded({ requestId }));
  }

  try {
    await tabs.sendMessage(tabId, action);
  } catch (err) {
    console.warn('handleSdkResponseToTab: delivery failed', err);
  }

  return { handled: true, response: undefined };
}
