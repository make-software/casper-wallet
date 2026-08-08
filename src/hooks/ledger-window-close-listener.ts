import { windows } from 'webextension-polyfill';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

export interface LedgerWindowCloseTracker {
  /** Watch `permissionWindowId`, replacing whatever was watched before. */
  arm(permissionWindowId: number): void;
  /** Stop watching. Safe to call when nothing is armed. */
  detach(): void;
}

/**
 * Owns the `windows.onRemoved` registration for a Ledger permission window.
 *
 * Two failures live here, which is why the lifecycle is a unit rather than two
 * lines inside the effect that opens the window:
 *
 * 1. `windows.onRemoved` passes the removed window's id, and a zero-arg
 *    listener is arity-assignable to it — so an unguarded handler fires for the
 *    FIRST window closed anywhere in the browser, clears the whole ledger slice
 *    mid-flow, and then removes itself so the real close clears nothing.
 * 2. The id guard makes self-removal correct, not guaranteed. A window that is
 *    never closed leaves the listener armed for the life of the document, and
 *    `ledgerStateCleared()` reaches the store from paths that do not close it
 *    (the Connect CTA in `LedgerDisconnectedFooter`, which `renderLedgerFooter`
 *    shows for `LedgerAskPermission` too). Another `useLedger` instance then
 *    opens its own permission window and takes over the slice — and closing the
 *    stale window afterwards wipes THAT flow's deploy/transaction, silently.
 *    `detach` is what the owner calls on unmount and when the slice is cleared.
 */
export function createLedgerWindowCloseTracker(): LedgerWindowCloseTracker {
  let armed: ((removedWindowId: number) => void) | null = null;

  const detach = () => {
    if (armed == null) return;

    windows.onRemoved.removeListener(armed);
    armed = null;
  };

  return {
    arm(permissionWindowId: number) {
      // Never hold two: a second registration would outlive the first window
      // and clear the slice out from under whatever replaced it.
      detach();

      const handleCloseWindow = (removedWindowId: number): void => {
        if (removedWindowId !== permissionWindowId) return;

        dispatchToMainStore(ledgerStateCleared());
        detach();
      };

      armed = handleCloseWindow;
      windows.onRemoved.addListener(handleCloseWindow);
    },
    detach
  };
}
