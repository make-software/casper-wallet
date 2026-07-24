import { tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';
import { CancellableMethod } from '@background/redux/windowManagement/types';

import { SdkMethod, sdkMethod } from '@content/sdk-method';

import { deliverViaOrigin } from './deliver-via-origin';

// Grace before cancelling an abandoned request: lets an in-flight genuine
// response (a button response, or a Ledger success cleanup that closes this
// window) land and mark itself 'responded' first. ~250 ms >> one in-process
// runtime.sendMessage hop.
export const CANCEL_GRACE_MS = 250;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export type OpenRequest = ReturnType<typeof selectOpenRequests>[number];

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
export async function cancelRequests(
  store: MainStore,
  initiallyOpen: OpenRequest[],
  source: string,
  afterMark?: () => void
): Promise<void> {
  if (initiallyOpen.length === 0) {
    afterMark?.();
    return;
  }

  await delay(CANCEL_GRACE_MS);

  const stillOpenIds = new Set(
    selectOpenRequests(store.getState()).map(r => r.requestId)
  );
  // Open at snapshot AND still open now — excludes answered-during-grace and
  // any new request opened during the grace.
  const toCancel = initiallyOpen.filter(r => stillOpenIds.has(r.requestId));

  // Mark synchronously from this snapshot, before the async sends.
  for (const { requestId } of toCancel) {
    store.dispatch(windowRequestResponded({ requestId }));
  }
  afterMark?.();

  await Promise.all(
    toCancel.map(async ({ requestId, tabId, origin, method }) => {
      const action = buildCancelResponse(method, requestId);
      try {
        await tabs.sendMessage(tabId, action);
      } catch {
        const delivered = await deliverViaOrigin(origin, action);
        store.dispatch(
          sagaError({
            source,
            message:
              `Cancel delivery to tab ${tabId} failed` +
              (delivered > 0
                ? '; delivered via same-origin fallback'
                : '; not delivered')
          })
        );
      }
    })
  );
}
