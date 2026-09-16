import { LedgerError } from 'casper-wallet-core';

import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestDeviceConfirmationChanged } from '@background/redux/windowManagement/actions';

/**
 * How many brackets currently hold each request, so overlapping ones report the
 * flag once between them rather than each releasing it for the others. They do
 * overlap: neither signing page disables its submit control while a call is in
 * flight, so a second click lands while the first is still on the device.
 */
const heldByRequest = new Map<string, number>();

/** @returns whether this is the first holder, i.e. whether to report the start. */
function acquire(requestId: string): boolean {
  const held = (heldByRequest.get(requestId) ?? 0) + 1;
  heldByRequest.set(requestId, held);

  return held === 1;
}

/** @returns whether this was the last holder, i.e. whether to report the end. */
function release(requestId: string): boolean {
  const held = (heldByRequest.get(requestId) ?? 1) - 1;

  if (held > 0) {
    heldByRequest.set(requestId, held);
    return false;
  }

  // Deleted rather than left at zero: `requestId` is dapp-controlled, and a page
  // that signs repeatedly would otherwise grow this map for its whole life.
  heldByRequest.delete(requestId);

  return true;
}

/**
 * Runs a Ledger device call with the background told, for its whole duration,
 * that this request is on the device — which keeps the window it runs in out of
 * the reuse rotation. A start without its end withholds the shared window from
 * every later request. Never rejects: `run` is invoked fire-and-forget.
 */
export async function runWithDeviceConfirmationReported(
  requestId: string | undefined,
  run: () => Promise<void>
): Promise<void> {
  // The internal flows (transfer, staking, `import-account-from-ledger`) have no
  // dapp request behind them, so there is no descriptor to flag.
  const report = (awaiting: boolean) => {
    if (requestId == null || requestId === '') {
      return;
    }

    if (!(awaiting ? acquire(requestId) : release(requestId))) {
      return;
    }

    dispatchToMainStore(
      windowRequestDeviceConfirmationChanged({ requestId, awaiting })
    );
  };

  report(true);

  try {
    await run();
  } catch (error) {
    // Status, never the message: core names every one of these `Error` and puts the whole event
    // — public key and transaction hash included — in the message it carries.
    console.error('useLedger: the device action failed', {
      errorName: (error as Error)?.name,
      ledgerStatus:
        error instanceof LedgerError ? error.ledgerEvent.status : undefined
    });
  } finally {
    report(false);
  }
}
