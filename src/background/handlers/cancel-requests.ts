import { tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
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

// Grace before cancelling an abandoned request: lets an in-flight genuine
// response (a button response, or a Ledger success cleanup that closes this
// window) land and mark itself 'responded' first. ~250 ms >> one in-process
// runtime.sendMessage hop.
export const CANCEL_GRACE_MS = 250;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export type CancelSource =
  'cancel-on-close' | 'cancel-on-supersede' | 'open-window-failed';

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
        // Only surface a banner when the response is genuinely lost. On the
        // supersede path this fires while the user is already looking at the
        // NEXT approval screen, so a "recovered anyway" banner is pure noise on
        // top of a signing prompt. Do NOT put `origin` in the message: appEvents
        // is broadcast to every replica.
        if (delivered === 0) {
          store.dispatch(
            sagaError({
              source,
              message: `Cancel delivery to tab ${tabId} failed; not delivered`
            })
          );
        }
      }
    })
  );
}

// The single cancellation trigger: window `windowId` stopped displaying
// requests (it closed, or it was reused for a different request). A request is
// a candidate only if this was its LAST window — a request the Ledger
// permission window still displays survives, and a request that never had this
// window (e.g. one registered moments ago, still waiting for its window) can
// never cancel itself.
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

// `windows.create` rejected, so no window will ever display this request and no
// `windows.onRemoved` will ever fire for it. Without this the dapp promise hangs
// until its own timeout (30 min by default).
export async function failRequestOnWindowError(
  store: MainStore,
  requestId: string
): Promise<void> {
  const request = selectOpenRequests(store.getState()).find(
    openRequest => openRequest.requestId === requestId
  );

  if (request == null) {
    return;
  }

  store.dispatch(windowRequestResponded({ requestId }));
  store.dispatch(
    sagaError({
      source: 'open-window-failed',
      message: 'Approval window could not be opened; the request was cancelled'
    })
  );

  const action = buildCancelResponse(request.method, requestId);
  try {
    await tabs.sendMessage(request.tabId, action);
  } catch (error) {
    console.error(
      'open-window-failed: cancel delivery failed',
      { requestId, method: request.method, tabId: request.tabId },
      error
    );
    await deliverViaOrigin(request.origin, action);
  }
}
