import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

/**
 * The Ledger permission window displays the SAME requestId as the approval
 * window that opened it. Registering it is what keeps the request alive when
 * the shared approval window is reused or closed while the user is still
 * confirming on the device — i.e. it is the UI half of the window-ownership
 * model, and skipping it silently brings the P0 back.
 *
 * Extracted from `useLedger` so the decision has a seam to test: the repo has
 * no React-hook harness, and inside the effect this was three lines that could
 * be deleted (or their `params.requestId` key renamed) with the suite staying
 * green.
 */

/** The internal flow (`import-account-from-ledger`) has no dapp request behind
 * it and legitimately passes no `requestId`. Every other domain does. */
const INTERNAL_FLOW_DOMAIN = 'popup.html';

export function registerLedgerPermissionWindow({
  domain,
  requestId,
  windowId
}: {
  domain: string;
  requestId: string | undefined;
  windowId: number;
}): void {
  if (requestId == null || requestId === '') {
    if (domain !== INTERNAL_FLOW_DOMAIN) {
      // Never log the URL or its params: a `signMessage` flow carries the
      // user's plaintext message there.
      console.error(
        'useLedger: permission window not registered — no requestId on an approval flow',
        { domain, windowId }
      );
    }
    return;
  }

  dispatchToMainStore(windowRequestWindowAttached({ requestId, windowId }));
}
