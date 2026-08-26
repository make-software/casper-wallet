import { tabs } from 'webextension-polyfill';

import { redactUrlQuery } from '@background/redact-url-query';
import { sagaError } from '@background/redux/app-events/actions';
import { SagaErrorSource } from '@background/redux/app-events/types';
import type { MainStore } from '@background/redux/get-main-store';
import {
  windowDetachedFromRequests,
  windowRequestResponded
} from '@background/redux/windowManagement/actions';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';
import {
  CancellableMethod,
  OpenRequest
} from '@background/redux/windowManagement/types';

import { SdkMethod, sdkMethod } from '@content/sdk-method';

import { deliverViaOrigin } from './deliver-via-origin';
import { getLiveTabOrigin } from './tab-origin';

// Grace before cancelling an abandoned request: lets an in-flight genuine
// response (a button response, or a Ledger success cleanup that closes this
// window) land and mark itself 'responded' first. ~250 ms >> one in-process
// runtime.sendMessage hop.
export const CANCEL_GRACE_MS = 250;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

// The window-driven cancel paths only. Derived from `SagaErrorSource` rather
// than spelled out again, so the two can never drift — a `source` this module
// dispatches is by construction one the banner reader knows.
// Neither `'open-window-failed'` nor `'sweep-orphaned-requests'` is here: both
// are produced by `failRequestOnWindowError`, a separate trigger with no
// window event behind it — and only the first of the two banners at all (see
// its `source` parameter below).
export type CancelSource = Extract<
  SagaErrorSource,
  'cancel-on-close' | 'cancel-on-supersede'
>;

export function buildCancelResponse(
  method: CancellableMethod,
  requestId: string
): SdkMethod {
  const meta = { requestId };
  switch (method) {
    case 'connect':
      return sdkMethod.connectResponse(false, meta);
    case 'switchAccount':
      return sdkMethod.switchAccountResponse(false, meta);
    case 'sign':
      return sdkMethod.signResponse({ cancelled: true }, meta);
    case 'signMessage':
      return sdkMethod.signMessageResponse({ cancelled: true }, meta);
    case 'signTypedData':
      return sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: null
        },
        meta
      );
    case 'decryptMessage':
      return sdkMethod.decryptMessageResponse({ cancelled: true }, meta);
  }
}

// Cancels a snapshot of open requests after a short grace, delivering the
// method-correct Cancel response to each dapp tab. Shared by the window-close
// path and the reuse/supersede path.
//
// `afterMark` runs once, synchronously, right after the survivors are marked
// 'responded' and before the async sends — the close path uses it to null the
// tracked windowId; the supersede path passes nothing (a new window is being
// tracked, so windowId must NOT be cleared).
async function cancelRequests(
  store: MainStore,
  initiallyOpen: OpenRequest[],
  source: CancelSource,
  displacedWindowId: number,
  afterMark?: () => void
): Promise<void> {
  if (initiallyOpen.length === 0) {
    afterMark?.();
    return;
  }

  await delay(CANCEL_GRACE_MS);

  const currentlyOpen = new Map(
    selectOpenRequests(store.getState()).map(r => [r.requestId, r])
  );
  // Re-checked against the CURRENT descriptor, not the snapshot. Two things
  // must still hold after the grace:
  //   - the request is still 'open'   — excludes answered-during-grace, and any
  //                                     request opened during the grace;
  //   - nothing but the displaced window displays it — a window attached DURING
  //     the grace means the request is genuinely back on screen. That is not
  //     hypothetical: the Ledger permission window attaches across a
  //     `runtime.sendMessage` round trip (see attach-window-to-request.ts), so
  //     it routinely lands after this routine snapshotted its candidates and
  //     dispatched the detach. Cancelling here would destroy the signature the
  //     user is confirming on the device — the exact P0 this model exists to
  //     prevent. `every` over an already-detached (empty) set is vacuously true.
  const toCancel = initiallyOpen.filter(request => {
    const current = currentlyOpen.get(request.requestId);

    return (
      current != null &&
      current.windowIds.every(windowId => windowId === displacedWindowId)
    );
  });

  // Mark synchronously from this snapshot, before the async sends.
  for (const { requestId } of toCancel) {
    store.dispatch(windowRequestResponded({ requestId }));
  }
  afterMark?.();

  await Promise.allSettled(
    toCancel.map(async ({ requestId, tabId, origin, method }) => {
      const action = buildCancelResponse(method, requestId);
      try {
        await tabs.sendMessage(tabId, action);
      } catch (error) {
        // NEVER log `action` — it is an SDK response payload.
        console.error(
          `${source}: cancel delivery failed`,
          { requestId, method, tabId },
          error
        );
        const delivered = await deliverViaOrigin(origin, action);
        // Suppression is gated on the SOURCE, not on the delivery count. On the
        // supersede path a recovered cancel fires while the user is already
        // looking at the NEXT approval screen, so the banner is pure noise on
        // top of a signing prompt. On the close path there is no replacement
        // screen — and `deliverViaOrigin` only counts same-origin sends to
        // active tabs that did not throw, which is not proof that the tab
        // holding the dapp's pending promise received anything. Do NOT put
        // `origin` in the message: appEvents is broadcast to every replica.
        if (source === 'cancel-on-supersede' && delivered > 0) {
          return;
        }

        store.dispatch(
          sagaError({
            source,
            message:
              delivered > 0
                ? `Cancel delivery to tab ${tabId} failed; recovered via the page`
                : `Cancel delivery to tab ${tabId} failed; not delivered`
          })
        );
      }
    })
  );
}

// The window-driven cancellation trigger: window `windowId` stopped displaying
// requests (it closed, or it was reused for a different request). NOT the only
// one — `failRequestOnWindowError` below is a second, independent trigger, for
// the case where no window ever opened at all, and it runs with no grace and no
// window event behind it. A request is a candidate here only if this was its
// LAST window — a request the Ledger permission window still displays survives,
// and a request that never had this window (e.g. one registered moments ago,
// still waiting for its window) can never cancel itself.
export async function cancelRequestsDisplacedBy(
  store: MainStore,
  windowId: number,
  source: CancelSource,
  afterMark?: () => void
): Promise<void> {
  const displaced = selectOpenRequests(store.getState()).filter(request =>
    request.windowIds.includes(windowId)
  );
  const candidates = displaced.filter(
    request => request.windowIds.length === 1
  );

  // Dispatched synchronously, before the grace: the slice must stop claiming
  // this window displays anything the moment it stopped doing so.
  //
  // Gated on there being something to detach. `windows.onRemoved` fires for
  // ANY window in the browser, and the store subscriber does no state-change
  // comparison — every dispatch is a popupState broadcast to every replica plus
  // a full storage.local rewrite, even when the reducer returns the identical
  // state object.
  if (displaced.length > 0) {
    store.dispatch(windowDetachedFromRequests({ windowId }));
  }

  await cancelRequests(store, candidates, source, windowId, afterMark);
}

// The trigger with no window event behind it — either `windows.create`
// rejected (no `windows.onRemoved` will ever fire for a window that never
// existed) or the startup sweep decided a hydrated 'open' row is orphaned
// (spec §8.1). Without this the dapp promise hangs until its own timeout
// (30 min by default).
//
// `source` defaults to the original trigger so the `open-window-failed` call
// site keeps its BANNER policy unchanged — its delivery does not: #1484's
// stale-tab check below applies to every source alike, so that call site's
// delivery is deliberately narrowed too, same as the sweep's. `source` doubles
// as the banner policy: only
// `'open-window-failed'` dispatches `sagaError` (a `windows.create` failure is
// the wallet's own doing, with nothing else to tell the user). Every other
// source — today just the sweep — is dapp-triggerable and console-only,
// matching the precedent in `sdk-methods.ts`'s `reportCapacityRefusal`: a
// banner mounted route-independently over every approval screen must not
// fire for a request the user cannot act on, and in close-as-wake the sweep's
// enumeration resolves inside another cancel's own grace, so it would often
// paint over an ordinary close or a live signing prompt.
export async function failRequestOnWindowError(
  store: MainStore,
  requestId: string,
  source: SagaErrorSource = 'open-window-failed'
): Promise<void> {
  const request = selectOpenRequests(store.getState()).find(
    openRequest => openRequest.requestId === requestId
  );

  if (request == null) {
    return;
  }

  store.dispatch(windowRequestResponded({ requestId }));

  const { tabId, origin, method, frameId } = request;
  const action = buildCancelResponse(method, requestId);

  // #1484: verify the tab still hosts the requesting origin BEFORE sending.
  // On a navigated-away tab `tabs.sendMessage` SUCCEEDS (the content script is
  // injected on every http(s) page), so the catch → `deliverViaOrigin`
  // fallback below would never fire — a swept row can be arbitrarily old, so
  // navigated-away is the expected case, not the exception. `tabs.get` reports
  // the TOP document's origin, so only a top-frame request (no `frameId`, or
  // `0`) is checkable this way; a sub-frame request goes straight to the
  // frame-targeted send, same as today.
  const isTopFrame = frameId == null || frameId === 0;
  const liveOrigin = isTopFrame ? await getLiveTabOrigin(tabId) : undefined;
  const staleOrigin = isTopFrame && liveOrigin !== origin;

  let delivered = 1;

  if (staleOrigin) {
    delivered = await deliverViaOrigin(origin, action, frameId);

    // Identifiers and origins only, matching sdk-response-to-tab's withheld-
    // response log — never a URL.
    console.error(
      `${source}: target tab no longer hosts the requesting origin; response withheld`,
      { requestId, tabId, expectedOrigin: origin, liveOrigin, delivered }
    );
  } else {
    try {
      await (frameId == null
        ? tabs.sendMessage(tabId, action)
        : tabs.sendMessage(tabId, action, { frameId }));
    } catch (error) {
      // Never the raw error: a `tabs.sendMessage` rejection can echo back a
      // navigated-away tab's URL, and one of this window's own URLs carries a
      // signMessage request's plaintext message as a query param.
      console.error(`${source}: cancel delivery failed`, {
        requestId,
        method,
        tabId,
        error: redactUrlQuery(error)
      });
      delivered = await deliverViaOrigin(origin, action, frameId);
    }
  }

  // The sweep (source === 'sweep-orphaned-requests') knowingly shares this
  // same tombstone-before-delivery ordering — an accepted residual, not an
  // oversight specific to the sweep.
  if (source !== 'open-window-failed') {
    console[delivered > 0 ? 'warn' : 'error'](
      `${source}: cancelled an orphaned request`,
      { requestId, tabId, delivered }
    );
    return;
  }

  // Dispatched AFTER the delivery attempt so the message can tell the truth.
  // The tombstone above is already written and `sdk-response-to-tab` drops
  // anything that arrives later, so a failure on both routes is terminal: the
  // dapp received nothing and will hang until its own timeout. Saying "the
  // request was cancelled" there would be a lie the user cannot act on.
  store.dispatch(
    sagaError({
      source,
      message:
        delivered > 0
          ? 'Approval window could not be opened; the request was cancelled'
          : 'Approval window could not be opened and the site could not be told; the request may still be pending there'
    })
  );
}
