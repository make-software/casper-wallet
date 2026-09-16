import { runtime, windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { cancelRequestsDisplacedBy } from './cancel-requests';

// Attaching a window is the ONLY way a request gains a display, so a `windowId`
// no `windows.onRemoved` will ever fire for leaves the request uncancellable.
export function attachWindowToRequest(
  store: MainStore,
  requestId: string,
  windowId: number
): void {
  // The UI-page caller crosses a message boundary, so the payload is not trusted:
  // a malformed id would sit in `windowIds` as one nothing can ever remove.
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

  // Undo an attach that should never have counted: run exactly what `onRemoved`
  // would have run.
  const repair = () => {
    void cancelRequestsDisplacedBy(store, windowId, 'cancel-on-close').catch(
      error => console.error('cancel-on-close: failed', error)
    );
  };

  // Only a provable verdict repairs: `tabs.update` resolves when navigation
  // STARTS, so repairing on an unsettled URL would cancel a live approval.
  const probe = windows.get(windowId, { populate: true }).then(
    browserWindow => {
      // The window is live, but is it OURS? A foreign id keeps `windowIds`
      // oversized, so closing the real approval window cancels nothing.
      const tab = browserWindow.tabs?.[0];
      const tabUrl = tab?.url ?? tab?.pendingUrl;

      // Not-yet-settled shapes: Chrome reports a navigating tab as `url: ''`
      // (target in `pendingUrl`), Firefox as `about:blank` with no `pendingUrl`.
      if (tabUrl == null || tabUrl === '' || tabUrl === 'about:blank') {
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

      // Diagnostics only: during the reuse round trip the URL may still be the
      // previous request's, so a mismatch is not proof of a wrong window.
      const shownRequestId = new URL(tabUrl).searchParams.get('requestId');

      if (shownRequestId == null) {
        console.warn('attachWindowToRequest: window carries no requestId', {
          requestId,
          windowId
        });
      } else if (shownRequestId !== requestId) {
        console.warn(
          'attachWindowToRequest: window shows a different requestId',
          { requestId, windowId }
        );
      }
    },
    (error: unknown) => {
      // A rejection is not proof the window is gone (transient context errors,
      // Safari quirks), so confirm against the window list.
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
  // The two arms above deliberately cannot catch each other, which leaves a
  // throw in the FULFILLED arm (`runtime.getURL`) covered by nothing.
  void probe.catch(error =>
    console.error('attachWindowToRequest: liveness check failed', error)
  );
}
