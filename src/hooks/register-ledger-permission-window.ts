import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

/**
 * The Ledger permission window displays the same requestId as the approval
 * window that opened it; registering it keeps the request alive while the
 * shared approval window is reused or closed mid-confirmation.
 */

/** The internal flow has no dapp request behind it and passes no `requestId`. */
const INTERNAL_FLOW_DOMAIN = 'popup.html';

/** Resolves true only once the background acknowledged the attach; an opener may not close before that. */
export function registerLedgerPermissionWindow({
  domain,
  requestId,
  windowId
}: {
  domain: string;
  requestId: string | undefined;
  windowId: number;
}): Promise<boolean> {
  if (requestId == null || requestId === '') {
    if (domain !== INTERNAL_FLOW_DOMAIN) {
      // Never log the URL or its params: a `signMessage` flow carries the user's plaintext message there.
      console.error(
        'useLedger: permission window not registered — no requestId on an approval flow',
        { domain, windowId }
      );
    }
    return Promise.resolve(false);
  }

  return dispatchToMainStore(
    windowRequestWindowAttached({ requestId, windowId })
  );
}
