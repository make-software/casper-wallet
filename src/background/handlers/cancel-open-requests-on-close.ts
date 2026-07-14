import { tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdCleared,
  windowRequestResponded
} from '@background/redux/windowManagement/actions';
import {
  selectOpenRequests,
  selectWindowId
} from '@background/redux/windowManagement/selectors';
import { CancellableMethod } from '@background/redux/windowManagement/types';

import { SdkMethod, sdkMethod } from '@content/sdk-method';

import { deliverViaOrigin } from './deliver-via-origin';

// Grace before assuming a closed window means "cancelled": lets an in-flight genuine
// response (a button response, or a Ledger success cleanup that closes this window) land
// and mark itself 'responded' first. ~250 ms >> one in-process runtime.sendMessage hop.
export const CANCEL_GRACE_MS = 250;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

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

export async function cancelOpenRequestsForClosedWindow(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  const initiallyOpen = selectOpenRequests(store.getState());

  // Null windowId only if the removed window is still the tracked one (no new window took
  // over during the grace). windowIdCleared touches ONLY windowId — never the requests map —
  // so it cannot clobber a concurrently-registered request.
  const clearIfStillTracked = () => {
    if (selectWindowId(store.getState()) === removedWindowId) {
      store.dispatch(windowIdCleared());
    }
  };

  if (initiallyOpen.length === 0) {
    clearIfStillTracked();
    return;
  }

  await delay(CANCEL_GRACE_MS);

  const stillOpenIds = new Set(
    selectOpenRequests(store.getState()).map(r => r.requestId)
  );
  // Requests open at close AND still open now — excludes answered-during-grace and any new
  // request opened during the grace.
  const toCancel = initiallyOpen.filter(r => stillOpenIds.has(r.requestId));

  // Mark synchronously from this snapshot, before the async sends.
  for (const { requestId } of toCancel) {
    store.dispatch(windowRequestResponded({ requestId }));
  }
  clearIfStillTracked();

  await Promise.all(
    toCancel.map(async ({ requestId, tabId, origin, method }) => {
      const action = buildCancelResponse(method, requestId);
      try {
        await tabs.sendMessage(tabId, action);
      } catch {
        const delivered = await deliverViaOrigin(origin, action);
        store.dispatch(
          sagaError({
            source: 'cancel-on-close',
            message:
              `Cancel-on-close delivery to tab ${tabId} failed` +
              (delivered > 0
                ? '; delivered via same-origin fallback'
                : '; not delivered')
          })
        );
      }
    })
  );
}
