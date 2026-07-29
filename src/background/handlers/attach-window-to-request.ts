import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { cancelRequestsDisplacedBy } from './cancel-requests';

// Attaching a window is the ONLY way a request gains a display, which makes it
// the only place a request can be made permanently uncancellable:
// `cancelRequestsDisplacedBy` cancels a request only when the window that went
// away was its LAST one, so a `windowId` that no `windows.onRemoved` will ever
// fire for keeps `windowIds` oversized forever. The request then survives every
// close and every reuse, stays 'open', and its dapp's promise hangs until the
// dapp's own timeout.
//
// Two callers reach here and BOTH need the guarantee, which is why it lives
// here rather than at either call site:
//   - `openWindow`, in-background, once `windows.create`/reuse resolves;
//   - `use-ledger`, from a UI page through `dispatchToMainStore`, i.e. across a
//     `runtime.sendMessage` round trip — by far the wider race of the two.
export function attachWindowToRequest(
  store: MainStore,
  requestId: string,
  windowId: number
): void {
  // The UI-page caller crosses a message boundary, so the payload is not
  // trusted to be well-formed. A malformed id would either throw in
  // `windows.get` or, worse, sit in `windowIds` as an id nothing can ever
  // remove.
  if (
    typeof requestId !== 'string' ||
    requestId === '' ||
    !Number.isInteger(windowId)
  ) {
    console.error('attachWindowToRequest: ignoring malformed attach', {
      requestId: typeof requestId,
      windowId: typeof windowId
    });
    return;
  }

  store.dispatch(windowRequestWindowAttached({ requestId, windowId }));

  // `windows.get` rejects both for an id that never existed (a buggy or hostile
  // dispatcher) and for one already removed — the window closed during the
  // round trip, so `onRemoved` ran while this request still had no window,
  // found no candidates, and nothing else will ever cancel it. Both cases are
  // repaired identically: run exactly what `onRemoved` would have run. When the
  // request still has another live window (the Ledger pair), the detach inside
  // simply shrinks the set and cancels nothing.
  void windows.get(windowId).catch(() => {
    void cancelRequestsDisplacedBy(store, windowId, 'cancel-on-close').catch(
      error => console.error('cancel-on-close: failed', error)
    );
  });
}
