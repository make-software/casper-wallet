import { Runtime, tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { selectRequestStatus } from '@background/redux/windowManagement/selectors';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';

import { deliverViaOrigin } from './deliver-via-origin';
import { isTrustedUiSender } from './private-state';
import { HandlerResult } from './types';

// Recover the originating dapp origin from the sender page URL. The response
// windows are opened with `?origin=<dappOrigin>` in their query string (e.g.
// `signature-request.html?requestId=..&origin=<dappOrigin>&tabId=..#/..`), and
// `sender.url` IS that page URL. `isTrustedUiSender` has already guaranteed
// `sender.url` is a defined extension URL by the time we parse it. Returns null
// if the param is absent or the URL is unparseable.
function recoverDappOrigin(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).searchParams.get('origin');
  } catch {
    return null;
  }
}

// SECURITY: the dapp `action` is the SDK response and may carry secret material
// (a `signatureHex` / `encryptedMessage` / signed payload). This surfaced error
// must reference ONLY the tabId + a static reason — never the action or any
// part of its payload. The message is parameterized on whether the same-origin
// fallback actually delivered, so a support reader is not told the response was
// recovered when it was in fact lost.
function deliveryFailedError(tabId: unknown, fallbackDelivered: boolean) {
  return sagaError({
    source: 'sdk-response-to-tab',
    message: fallbackDelivered
      ? `SDK response delivery to tab ${tabId} failed; delivered via same-origin fallback`
      : `SDK response delivery to tab ${tabId} failed; no same-origin fallback available — response not delivered`
  });
}

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
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<HandlerResult> {
  const candidate = message as Partial<SdkResponseToTabMessage> | undefined;

  if (candidate?.type !== SDK_RESPONSE_TO_TAB) {
    return { handled: false };
  }

  // Defense-in-depth: this handler reroutes a response to an arbitrary dapp
  // tab, so only the extension's own UI pages may originate it. With the
  // private MessageChannel transport + SDK_REQUEST_TYPES allowlist (P0.2) this
  // is already unreachable from a page, but gating on the sender guards against
  // a future allowlist regression or a content-script-world compromise.
  // Silently drop (no response), matching the private-state / legacy-import gate.
  if (!isTrustedUiSender(sender)) {
    return { handled: true };
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

  const origin = recoverDappOrigin(sender.url);
  const validTab = Number.isInteger(tabId) && tabId >= 0;

  if (!validTab) {
    // No usable tab. Attempt the same-origin fallback (broadcast to any active
    // tab of the recovered dapp origin). Only mark responded when the fallback
    // ACTUALLY delivered to at least one tab — we ARE delivering, so a later
    // duplicate must dedupe. When nothing was delivered (no origin, or the
    // broadcast matched zero tabs), do NOT mark responded: a valid retry must
    // still be able to deliver. Either way surface the non-fatal error.
    const delivered = await deliverViaOrigin(origin, action);
    if (delivered > 0 && requestId != null) {
      store.dispatch(windowRequestResponded({ requestId }));
    }
    store.dispatch(deliveryFailedError(tabId, delivered > 0));
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
  } catch {
    // Tab gone / no listener → try the same-origin fallback (if we can recover
    // the origin) and surface the non-fatal error, choosing the message based
    // on whether the fallback actually delivered. The optimistic mark above
    // already deduped any retry (delivery failure is terminal by design).
    const delivered = await deliverViaOrigin(origin, action);
    store.dispatch(deliveryFailedError(tabId, delivered > 0));
  }

  return { handled: true, response: undefined };
}
