import { runtime, windows } from 'webextension-polyfill';

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

  // Undo an attach that should never have counted: run exactly what
  // `onRemoved` would have run. When the request still has another live window
  // (the Ledger pair), the detach inside simply shrinks the set and cancels
  // nothing.
  const repair = () => {
    void cancelRequestsDisplacedBy(store, windowId, 'cancel-on-close').catch(
      error => console.error('cancel-on-close: failed', error)
    );
  };

  // Two independent things can be wrong with `windowId`, and they are checked
  // in the two arms below. Note the asymmetry: a provable verdict repairs,
  // anything inconclusive does not. On the reuse path `tabs.update` resolves
  // when the navigation STARTS, so a legitimate window can be probed before its
  // URL settles — repairing on that would cancel a live approval, the exact
  // failure this model exists to prevent.
  void windows.get(windowId, { populate: true }).then(
    browserWindow => {
      // (1) The window is live, but is it OURS? "A window with this id exists"
      // is what every live browser window satisfies. A foreign id sits in
      // `windowIds` keeping the set oversized, so closing the real approval
      // window no longer cancels anything and the request's fate is tied to an
      // unrelated window the user may never close.
      const tab = browserWindow.tabs?.[0];
      const tabUrl = tab?.url ?? tab?.pendingUrl;

      if (tabUrl == null || tabUrl === '') {
        return;
      }

      if (!tabUrl.startsWith(runtime.getURL(''))) {
        console.error(
          'attachWindowToRequest: window is not an extension page',
          { requestId, windowId }
        );
        repair();
        return;
      }

      // Diagnostic only, for the same reason: during the reuse round trip the
      // URL may still be the previous request's.
      const shownRequestId = new URL(tabUrl).searchParams.get('requestId');
      if (shownRequestId != null && shownRequestId !== requestId) {
        console.warn(
          'attachWindowToRequest: window shows a different requestId',
          { requestId, windowId }
        );
      }
    },
    (error: unknown) => {
      // (2) The probe rejected. That happens for an id that never existed (a
      // buggy dispatcher) and for one already removed — the window closed
      // during the round trip, so `onRemoved` ran while this request still had
      // no window, found no candidates, and nothing else would ever cancel it.
      //
      // But a rejection is not proof of either: a transient extension-context
      // error or a Safari window-type quirk reject too, and repairing on one of
      // those cancels an approval that is on screen. Rather than narrowing on
      // the error's text — which differs per browser and is exactly the kind of
      // guard that silently stops matching — confirm against the window list,
      // and do nothing if even that is unavailable.
      console.error(
        'attachWindowToRequest: window liveness probe rejected',
        { requestId, windowId },
        error
      );

      void windows
        .getAll()
        .then(allWindows => {
          if (!allWindows.some(({ id }) => id === windowId)) {
            repair();
          }
        })
        .catch(listError =>
          console.error(
            'attachWindowToRequest: window list unavailable, leaving the attach standing',
            listError
          )
        );
    }
  );
}
