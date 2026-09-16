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
// response land and mark itself 'responded' first.
export const CANCEL_GRACE_MS = 250;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

// The window-driven cancel paths only. Derived from `SagaErrorSource` rather
// than spelled out again, so the two can never drift.
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

// Cancels a snapshot of open requests after a short grace; `afterMark` runs
// synchronously once the survivors are marked 'responded'.
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
  // Re-checked against the CURRENT descriptor: a Ledger window can attach during
  // the grace, and cancelling a request back on screen would destroy a signature.
  const toCancel = initiallyOpen.filter(request => {
    const current = currentlyOpen.get(request.requestId);

    return (
      current != null &&
      current.windowIds.every(windowId => windowId === displacedWindowId)
    );
  });

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
        // Gated on the SOURCE: on supersede the banner would paint over the
        // next approval screen. No `origin` — appEvents is broadcast.
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

// Window `windowId` stopped displaying requests. A request is a candidate only
// if this was its LAST window — one a Ledger window still displays survives.
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

  // `windows.onRemoved` fires for ANY window, and every dispatch costs a
  // popupState broadcast to every replica plus a full storage.local rewrite.
  if (displaced.length > 0) {
    store.dispatch(windowDetachedFromRequests({ windowId }));
  }

  await cancelRequests(store, candidates, source, windowId, afterMark);
}

// The store-free half of `failRequestOnWindowError`: takes a snapshot row
// rather than reading the store, so a saga with no store access can use it too.
export type CancelDeliveryRow = Pick<
  OpenRequest,
  'requestId' | 'tabId' | 'origin' | 'method' | 'frameId'
>;

export async function deliverCancelResponse(
  row: CancelDeliveryRow,
  logSource: SagaErrorSource
): Promise<number> {
  const { requestId, tabId, origin, method, frameId } = row;
  const action = buildCancelResponse(method, requestId);

  // Verify the origin BEFORE sending: on a navigated-away tab `tabs.sendMessage`
  // SUCCEEDS, so the catch never fires. `tabs.get` sees the TOP document only.
  const isTopFrame = frameId == null || frameId === 0;
  const liveOrigin = isTopFrame ? await getLiveTabOrigin(tabId) : undefined;
  const staleOrigin = isTopFrame && liveOrigin !== origin;

  let delivered = 1;

  if (staleOrigin) {
    delivered = await deliverViaOrigin(origin, action, frameId);

    // Identifiers and origins only — never a URL.
    console.error(
      `${logSource}: target tab no longer hosts the requesting origin; response withheld`,
      { requestId, tabId, expectedOrigin: origin, liveOrigin, delivered }
    );
  } else {
    try {
      await (frameId == null
        ? tabs.sendMessage(tabId, action)
        : tabs.sendMessage(tabId, action, { frameId }));
    } catch (error) {
      // Never the raw error: a `tabs.sendMessage` rejection can echo back a URL,
      // and one of ours carries a signMessage request's plaintext as a param.
      console.error(`${logSource}: cancel delivery failed`, {
        requestId,
        method,
        tabId,
        error: redactUrlQuery(error)
      });
      delivered = await deliverViaOrigin(origin, action, frameId);
    }
  }

  return delivered;
}

// `source` doubles as the banner policy: only `'open-window-failed'` dispatches
// `sagaError`; every other source is dapp-triggerable and console-only.
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
  const delivered = await deliverCancelResponse(
    { requestId, tabId, origin, method, frameId },
    source
  );

  if (source !== 'open-window-failed') {
    console[delivered > 0 ? 'warn' : 'error'](
      `${source}: cancelled an orphaned request`,
      { requestId, tabId, delivered }
    );
    return;
  }

  // Dispatched AFTER the delivery attempt so the message can tell the truth: the
  // tombstone is written, so a failure on both routes is terminal for the dapp.
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
