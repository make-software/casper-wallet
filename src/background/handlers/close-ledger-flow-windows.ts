import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { getRequest } from '@background/redux/windowManagement/request-map';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';

export interface CloseLedgerFlowWindowsTarget {
  /** Absent for the internal flows, which have no dapp request behind them. */
  requestId?: string;
  /** The dispatcher's own Ledger window — see the action's docblock. */
  permissionWindowId?: number;
}

/**
 * Closes the caller's permission window plus every window still displaying
 * `requestId`, minus whatever another open request still claims.
 *
 * Never rejects: every caller is a fire-and-forget UI dispatch, and an
 * unhandled rejection in a service worker is invisible.
 */
export async function handleCloseLedgerFlowWindows(
  store: MainStore,
  { requestId, permissionWindowId }: CloseLedgerFlowWindowsTarget
): Promise<void> {
  const state = store.getState();
  const targets = new Set<number>();

  // Never `state.ledger.windowId`: one global slot that a second flow can take
  // over, so reading it here removed that flow's window mid-confirmation and
  // wiped the deploy it was signing. The caller proves ownership instead.
  if (permissionWindowId != null) {
    targets.add(permissionWindowId);
  }

  const hasRequestId = typeof requestId === 'string' && requestId !== '';

  if (hasRequestId) {
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

  // Same subtraction as the response path, and for the same reason: a window
  // shared with another open request is that request's only display, so
  // removing it here answers a dapp we were never asked about.
  const claimedByOthers = new Set<number>();
  for (const openRequest of selectOpenRequests(state)) {
    if (hasRequestId && openRequest.requestId === requestId) continue;

    for (const windowId of openRequest.windowIds) {
      claimedByOthers.add(windowId);
    }
  }

  const removals = [...targets].filter(id => !claimedByOthers.has(id));

  // Before the removals so the slice cannot outlive them, and only when it still
  // names a window we are about to take down — clearing it otherwise wipes the
  // `deploy`/`transaction` a flow that took the slot over is signing.
  if (
    permissionWindowId != null &&
    state.ledger.windowId === permissionWindowId &&
    removals.includes(permissionWindowId)
  ) {
    store.dispatch(ledgerStateCleared());
  }

  await Promise.allSettled(
    removals.map(async windowId => {
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
