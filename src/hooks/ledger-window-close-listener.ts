import { windows } from 'webextension-polyfill';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

export interface LedgerWindowCloseTracker {
  /**
   * Watch `permissionWindowId`, replacing whatever was watched before.
   * `onClosed` runs only for that window actually being removed — never on `detach`.
   */
  arm(permissionWindowId: number, onClosed?: () => void): void;
  /** Stop watching. Safe to call when nothing is armed. */
  detach(): void;
}

/**
 * Owns the `windows.onRemoved` registration for a Ledger permission window.
 *
 * The listener must be id-guarded and single: an unguarded one fires for the first
 * window closed anywhere in the browser, and one left armed on a window nobody
 * closes wipes whatever flow has since taken over the ledger slice.
 */
export function createLedgerWindowCloseTracker(): LedgerWindowCloseTracker {
  let armed: ((removedWindowId: number) => void) | null = null;

  const detach = () => {
    if (armed == null) return;

    windows.onRemoved.removeListener(armed);
    armed = null;
  };

  return {
    arm(permissionWindowId: number, onClosed?: () => void) {
      // Never hold two: a second registration would outlive the first window
      // and clear the slice out from under whatever replaced it.
      detach();

      const handleCloseWindow = (removedWindowId: number): void => {
        if (removedWindowId !== permissionWindowId) return;

        dispatchToMainStore(ledgerStateCleared());
        detach();
        onClosed?.();
      };

      armed = handleCloseWindow;
      windows.onRemoved.addListener(handleCloseWindow);
    },
    detach
  };
}
