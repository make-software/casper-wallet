import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { getRequest } from '@background/redux/windowManagement/request-map';

/**
 * Closes `ledger.windowId` plus every window still displaying `requestId`.
 *
 * Never rejects: every caller is a fire-and-forget UI dispatch, and an
 * unhandled rejection in a service worker is invisible.
 */
export async function handleCloseLedgerFlowWindows(
  store: MainStore,
  requestId: string | undefined
): Promise<void> {
  const state = store.getState();
  const targets = new Set<number>();

  const permissionWindowId = state.ledger.windowId;
  if (permissionWindowId != null) {
    targets.add(permissionWindowId);
  }

  if (typeof requestId === 'string' && requestId !== '') {
    // `getRequest`, never `requests[requestId]`: requestId is dapp-controlled,
    // so a bare index can read an inherited Object.prototype member.
    const request = getRequest(state.windowManagement.requests, requestId);

    if (request?.status === 'open') {
      for (const windowId of request.windowIds) {
        targets.add(windowId);
      }
    } else {
      // Reached when the response path already handled this flow and collapsed
      // the descriptor; the permission window alone is the correct residue.
      console.warn(
        'closeLedgerFlowWindows: no open descriptor for the request; closing the permission window only',
        { requestId }
      );
    }
  }

  // Before the removals, and unconditionally: the slice must not keep pointing
  // at a window we are tearing down even if every removal fails.
  store.dispatch(ledgerStateCleared());

  await Promise.allSettled(
    [...targets].map(async windowId => {
      try {
        await windows.remove(windowId);
      } catch (error) {
        // Ids and the error only — a Windows.Window carries `tabs[].url`, and a
        // Ledger permission URL embeds the plaintext signMessage message.
        console.error(
          'closeLedgerFlowWindows: window removal failed',
          { windowId },
          error
        );
      }
    })
  );
}
