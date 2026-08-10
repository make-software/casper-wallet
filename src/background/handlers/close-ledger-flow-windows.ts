import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { getRequest } from '@background/redux/windowManagement/request-map';

/**
 * Closes the windows a Ledger flow owns, and nothing else.
 *
 * Ownership is two sources, unioned:
 *   - `ledger.windowId` — the separate permission window this flow opened;
 *   - `requests[requestId].windowIds` — every window still DISPLAYING this
 *     flow's request, i.e. the dapp approval window that opened the permission
 *     window, plus the permission window itself (use-ledger attaches it).
 *
 * The second source is why this lives in the background: `selectPopupState`
 * strips `requests` from every replica, so the UI cannot compute it. It is also
 * why the shared `windowManagement.windowId` is NOT used as a stand-in — if
 * another request reused that window while the user was at the device, the
 * supersede path already dispatched `windowDetachedFromRequests` for it, so it
 * is correctly absent from OUR request's `windowIds` and must not be closed.
 *
 * Replaces a `windows.getAll({ windowTypes: ['popup'] })` sweep that closed
 * every popup window in the profile — other dapps' approval windows (each
 * removal reaching the cancel-on-close path), the secret-key export window, and
 * popup windows belonging to ordinary web pages. WALLET-1416.
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
      // The descriptor collapses to `{ status: 'responded' }` — dropping
      // windowIds — as soon as the signature response reaches the background.
      // That normally happens AFTER this command (SignatureCompleted is emitted
      // synchronously before `signTransaction` returns), but the ordering is not
      // guaranteed across a service-worker restart. Degrading here leaves the
      // approval window on screen for an already-answered request; say so rather
      // than closing something we cannot prove we own.
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
