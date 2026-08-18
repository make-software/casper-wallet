import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestDeviceConfirmationChanged } from '@background/redux/windowManagement/actions';

/**
 * Runs a Ledger device call with the background told, for its whole duration,
 * that this request is on the device — which is what keeps the window it runs
 * in out of the reuse rotation (`awaitingDeviceConfirmation` in
 * windowManagement/types).
 *
 * The bracket lives here rather than as two calls in `useLedger` for the reason
 * `register-ledger-permission-window.ts` exists: the repo has no React-hook
 * harness, so inside the hook the pairing would be two lines that can drift
 * apart — and a start without its end withholds the shared window from every
 * later request for the rest of that request's life.
 *
 * Never rejects. `run` is invoked fire-and-forget by the hook, exactly as the
 * bare `ledgerAction()` it replaces was; a rejection propagated from here would
 * be the unhandled rejection that call site already produced.
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

    dispatchToMainStore(
      windowRequestDeviceConfirmationChanged({ requestId, awaiting })
    );
  };

  report(true);

  try {
    await run();
  } catch (error) {
    // Name only: a Ledger error carries the public key and transaction hash it
    // failed on, and this line is a diagnostic, not the user-facing surface —
    // the same failure already reaches the screen through the event subject.
    console.error('useLedger: the device action failed', {
      errorName: (error as Error)?.name
    });
  } finally {
    report(false);
  }
}
