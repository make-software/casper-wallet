import { windows } from 'webextension-polyfill';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

/**
 * `windows.onRemoved` passes the removed window's id, and a zero-arg listener
 * is arity-assignable to it — so the previous inline handler fired for the
 * FIRST window closed anywhere in the browser, cleared the whole ledger slice
 * mid-flow, and then removed itself so the real close cleared nothing.
 *
 * Extracted from `useLedger` for the same reason as
 * `registerLedgerPermissionWindow`: the repo has no React-hook harness, and
 * inline the id comparison is one line that can be deleted with the suite
 * staying green.
 *
 * Takes the id as an argument rather than reading it from the effect's scope:
 * the redux `windowId` the effect depends on is `null` for the whole body (the
 * body only runs when it is), so comparing against it would early-return
 * forever.
 */
export function makeLedgerWindowCloseListener(permissionWindowId: number) {
  const handleCloseWindow = (removedWindowId: number): void => {
    if (removedWindowId !== permissionWindowId) return;

    dispatchToMainStore(ledgerStateCleared());
    windows.onRemoved.removeListener(handleCloseWindow);
  };

  return handleCloseWindow;
}
