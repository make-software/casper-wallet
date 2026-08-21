import { Runtime, tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import {
  selectOpenRequest,
  selectRequestStatus
} from '@background/redux/windowManagement/selectors';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';

import {
  NOTHING_DISPLAYS,
  RespondedDisplays,
  closeLedgerWindowsAfterResponse,
  markRequestResponded
} from './close-windows-on-response';
import { deliverViaOrigin } from './deliver-via-origin';
import { isTrustedUiSender } from './private-state';
import { getLiveTabOrigin } from './tab-origin';
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

// Is a dropped duplicate one that costs nothing?
//
// It cannot be decided by `payload.cancelled` alone: `connectResponse` and
// `switchAccountResponse` type their payload as a bare boolean, so that branch
// does not generalise across the union. For those two only `false` is the
// throwaway shape — it is what `buildCancelResponse` synthesises and what the
// reject buttons send. `true` is a genuine approval, and the two interactive
// approval paths mutate wallet state BEFORE they send (`approve-connection`
// awaits `connectAccounts`, `switch-account` awaits `changeActiveAccount`), so a
// lost `true` leaves the wallet listing the site as connected while the dapp was
// told the user rejected. That escalates like any other loss.
//
// KNOWN NOISE: `select-account/index.tsx:64-71` sends `connectResponse(true)`
// from the render body with no guard, so a re-render (the `windowRequestResponded`
// broadcast triggers one) re-sends an already-DELIVERED approval, and that
// duplicate lands here as an error. Nothing is lost in that case, but the status
// alone cannot distinguish it from a `true` racing a cancel. Fixing it belongs in
// that page, not in this classifier.
//
// And it fails LOUD — anything not recognised as benign is treated as a lost
// result, because the cost of a missed warning is a line in a log while the
// cost of a missed error is a signature the user produced and nobody ever
// received.
function isBenignDuplicate(payload: unknown): boolean {
  if (typeof payload === 'boolean') {
    return payload === false;
  }

  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { cancelled?: unknown }).cancelled === true
  );
}

// Background dedupe of SDK responses (P0.5 root cause). There is no server; the
// background store is the single writer, which is what makes this atomic.
// The signature UI pages used to `tabs.sendMessage` the response to the dapp
// tab directly and guard double-sends with a per-page `responseSentRef`
// (fragile: per instance, lost on reload). Now every response is forwarded
// here and deduped by `requestId`: the FIRST response for a request wins,
// later ones are dropped.
//
// CRITICAL: drop ONLY when the request is already 'responded'. Three causes
// mark requests responded — a window closing (`windows.onRemoved`), a window
// being reused for a new request (`openWindow` resolving with `reused: true`),
// and a window failing to open at all (`windows.create` rejecting). The first
// two run the shared detach-and-cancel routine (`cancelRequestsDisplacedBy` →
// `cancelRequests`) after a short grace; the third (`failRequestOnWindowError`)
// dispatches directly, with no grace. Dropping only on 'responded' kills the
// real duplicate (a cancel racing a successful sign, where the sign already
// set 'responded') without ever suppressing a first response.
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

  // Dedupe: first response for this requestId wins. Drop iff 'responded'
  // (see the race rationale above).
  if (
    requestId != null &&
    selectRequestStatus(store.getState(), requestId) === 'responded'
  ) {
    // A dropped `cancelled: true` is benign; a dropped signature never is, so
    // say which one happened. The benign case is the overwhelming majority of
    // these lines, and at `error` severity it trains a reader to skip past the
    // one that means a signed transaction was destroyed. Log the identifiers
    // ONLY — `action` carries `signatureHex` / `encryptedMessage` (see the
    // SECURITY note above).
    const identifiers = { requestId, tabId, type: action?.type };

    if (isBenignDuplicate(action?.payload)) {
      console.warn(
        'sdk-response-to-tab: dropped a duplicate cancel',
        identifiers
      );
    } else {
      // Log-only, deliberately. The user-facing half would need copy that does
      // not name an internal tabId (which identifies no dapp and suggests no
      // next step) and an i18n key — `SagaErrorBanner` renders `message`
      // verbatim and untranslated, and is mounted over the approval screens.
      // Same call as item #19 in this PR: surface it in the log now, decide the
      // banner separately.
      console.error(
        'sdk-response-to-tab: dropped a completed response — the result was lost',
        identifiers
      );
    }
    // Drop the duplicate — it never reaches the tab. Respond so the forwarding
    // UI's `runtime.sendMessage` promise still resolves (some callers await it
    // before closing the window).
    return { handled: true, response: undefined };
  }

  // The descriptor is the authoritative record of who asked; the message's
  // `tabId` is UI-supplied. Read it BEFORE `markRequestResponded` — the
  // tombstone that call writes is `{ status: 'responded' }`, so `tabId`,
  // `frameId` and `origin` are gone the moment after.
  const request =
    requestId != null
      ? selectOpenRequest(store.getState(), requestId)
      : undefined;

  // An MV3 service-worker restart empties the requests map while the approval
  // window lives on, so a legitimate response can arrive with no descriptor at
  // all. The window url still carries `?origin=`, so fall back to that rather
  // than dropping a signature the user just produced.
  const expectedOrigin = request?.origin ?? recoverDappOrigin(sender.url);
  const frameId = request?.frameId;

  const validTab = Number.isInteger(tabId) && tabId >= 0;
  // Synchronous, so it can run before the optimistic mark below — anything
  // awaited there would reopen the double-delivery race. Both values come from
  // `sender.tab.id` at request time, so a mismatch means a buggy or
  // compromised UI page rather than an ordinary race; refusing is cheap and it
  // is the only place that would notice.
  const tabIdMatchesRequest = request == null || tabId === request.tabId;

  let displays: RespondedDisplays = NOTHING_DISPLAYS;

  if (!validTab || !tabIdMatchesRequest) {
    // No usable tab, or not the tab that made the request. Attempt the
    // same-origin fallback (broadcast to any active tab of the dapp origin).
    // Only mark responded when the fallback ACTUALLY delivered to at least one
    // tab — we ARE delivering, so a later duplicate must dedupe. When nothing
    // was delivered (no origin, or the broadcast matched zero tabs), do NOT
    // mark responded: a valid retry must still be able to deliver. Either way
    // surface the non-fatal error.
    const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

    if (validTab) {
      // Identifiers only (see the SECURITY note above).
      console.error(
        'sdk-response-to-tab: response tab is not the requesting tab; response withheld',
        {
          requestId,
          tabId,
          expectedTabId: request?.tabId,
          type: action?.type,
          delivered
        }
      );
    }

    if (delivered > 0 && requestId != null) {
      displays = markRequestResponded(store, requestId);
    }
    store.dispatch(deliveryFailedError(tabId, delivered > 0));
    void closeLedgerWindowsAfterResponse(store, displays);
    return { handled: true, response: undefined };
  }

  // Mark responded OPTIMISTICALLY, BEFORE the await. `runtime.onMessage`
  // handlers interleave at every `await`, so two near-simultaneous responses
  // for the same requestId (e.g. a genuine sign response racing a cancel from
  // either cancel path — window close or window reuse) would BOTH read status
  // `undefined` if we marked after the send — and both would reach the dapp.
  // Dispatching synchronously here (before yielding the event loop) means
  // a second message processed during the first's in-flight send reads
  // 'responded' and drops. Trade-off: on a genuine delivery failure the request
  // stays 'responded' and any retry is dropped — acceptable, since delivery
  // failure is already terminal (no retry path) and deterministic dedup is the goal.
  // The read that snapshots the display windows must stay in this same
  // synchronous block, for the same reason.
  if (requestId != null) {
    displays = markRequestResponded(store, requestId);
  }

  // The tab may have navigated to another origin while the approval sat on
  // screen. Tab ids survive navigation and the content script is injected on
  // every http(s) origin, so the new document has a live receiver for a
  // signature it never asked for.
  //
  // AFTER the optimistic mark, deliberately: this awaits, and any await placed
  // before the mark reopens the double-delivery race described above. A
  // withheld response therefore stays 'responded' — the same terminal-failure
  // trade-off the mark already accepts.
  //
  // Only for a top-frame request. `tabs.get` reports the TOP document's url,
  // while a sub-frame request's `origin` is the frame's own, so comparing them
  // would refuse every legitimate iframe-embedded dapp. A sub-frame is covered
  // by the frame scoping instead: a top-level navigation destroys the frame, so
  // its `frameId` no longer resolves and the send fails into the fallback.
  //
  // Not a guarantee — the tab can still navigate between this read and the send
  // below. It shrinks the window from the whole approval to one event-loop turn.
  if (frameId == null || frameId === 0) {
    const liveOrigin = await getLiveTabOrigin(tabId);

    if (expectedOrigin == null || liveOrigin !== expectedOrigin) {
      const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

      // Identifiers and origins only (see the SECURITY note above).
      console.error(
        'sdk-response-to-tab: target tab no longer hosts the requesting origin; response withheld',
        {
          requestId,
          tabId,
          expectedOrigin,
          liveOrigin,
          type: action?.type,
          delivered
        }
      );

      store.dispatch(deliveryFailedError(tabId, delivered > 0));
      void closeLedgerWindowsAfterResponse(store, displays);

      return { handled: true, response: undefined };
    }
  }

  try {
    // `all_frames: true` in every manifest, so a bare `tabs.sendMessage` is
    // delivered to EVERY frame of the tab — a third-party iframe on the dapp's
    // own page included. Target the frame that actually asked.
    //
    // Two call shapes rather than `{ frameId: undefined }`: an options object
    // means "target this frame", and a descriptor with no recorded frame
    // (pre-existing state, or a sender the browser gave no frameId) must keep
    // today's behaviour rather than being retargeted at the top frame.
    await (frameId == null
      ? tabs.sendMessage(tabId, action)
      : tabs.sendMessage(tabId, action, { frameId }));
  } catch (error) {
    // Tab gone / no listener → try the same-origin fallback (if we can recover
    // the origin) and surface the non-fatal error, choosing the message based
    // on whether the fallback actually delivered. The optimistic mark above
    // already deduped any retry (delivery failure is terminal by design).
    const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

    // Cause AND outcome, because both were indistinguishable before: `Could not
    // establish connection`, a `DataCloneError` and a Safari-specific rejection
    // collapsed into one line, and so did "recovered via another same-origin
    // tab" and "the signature the user produced is gone". The outcome otherwise
    // lives only in the dispatched banner, which no support reader gets.
    // Severity splits on it, the way the duplicate classifier above splits
    // benign from lost. Identifiers only (see the SECURITY note above).
    const identifiers = { requestId, tabId, type: action?.type, delivered };

    if (delivered > 0) {
      console.warn(
        'sdk-response-to-tab: delivery to tab failed; recovered via same-origin fallback',
        identifiers,
        error
      );
    } else {
      console.error(
        'sdk-response-to-tab: delivery to tab failed; response not delivered',
        identifiers,
        error
      );
    }

    store.dispatch(deliveryFailedError(tabId, delivered > 0));
  }

  void closeLedgerWindowsAfterResponse(store, displays);

  return { handled: true, response: undefined };
}
