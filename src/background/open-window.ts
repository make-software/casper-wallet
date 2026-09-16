import {
  OpenWindowProps,
  createOpenWindow
} from '@background/create-open-window';
import { attachWindowToRequest } from '@background/handlers/attach-window-to-request';
import {
  cancelRequestsDisplacedBy,
  failRequestOnWindowError
} from '@background/handlers/cancel-requests';
import { redactUrlQuery } from '@background/redact-url-query';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';
import {
  selectIsWindowBusyWithDevice,
  selectWindowId
} from '@background/redux/windowManagement/selectors';

export interface OpenApprovalWindowProps extends OpenWindowProps {
  /** Every branch that saves a request from being stranded is gated on this. */
  requestId: string;
}

// Fire-and-forget by design: the message handler must not block on a browser
// window.
export function openWindow(
  store: MainStore,
  { requestId, ...openWindowProps }: OpenApprovalWindowProps
) {
  // Recovery shared by every "no window will ever display this request"
  // outcome: log identifiers only, never the action or payload.
  const failIncomingRequest = (context: string, details: unknown) => {
    console.error(context, details);

    void failRequestOnWindowError(store, requestId).catch(err =>
      console.error('open-window-failed: recovery failed', err)
    );
  };

  // Withheld while a Ledger confirmation is in flight in it — reuse navigates
  // that window's tab out from under the device call.
  const trackedWindowId = selectWindowId(store.getState());
  const reusableWindowId =
    trackedWindowId != null &&
    selectIsWindowBusyWithDevice(store.getState(), trackedWindowId)
      ? null
      : trackedWindowId;

  const chain = createOpenWindow({
    windowId: reusableWindowId,
    setWindowId: (id: number) => store.dispatch(windowIdChanged(id)),
    clearWindowId: () => store.dispatch(windowIdCleared())
  })(openWindowProps).then(
    ({ window, reused }) => {
      if (window.id == null) {
        // No `windows.onRemoved` fires for a window without an id, so nothing
        // else would ever cancel the request.
        failIncomingRequest('openWindow: resolved window has no id', {
          requestId
        });
        return;
      }

      const windowId = window.id;

      // Runs before the attach below, snapshotting its candidates synchronously,
      // so the incoming request — which has no window yet — is never among them.
      if (reused) {
        void cancelRequestsDisplacedBy(
          store,
          windowId,
          'cancel-on-supersede'
        ).catch(error => console.error('cancel-on-supersede: failed', error));
      }

      // The window can close during the awaited round-trips above;
      // `attachWindowToRequest` owns the liveness repair for that case.
      attachWindowToRequest(store, requestId, windowId);
    },
    error => {
      // Never log the raw error: a rejection's text can echo the URL it failed
      // on, and a `signMessage` URL carries the plaintext message.
      failIncomingRequest('openWindow: failed to open approval window', {
        requestId,
        windowApp: openWindowProps.windowApp,
        error: redactUrlQuery(error)
      });
    }
  );
  // The two-arm form above must not catch the recovery it triggers, leaving the
  // success arm uncovered: a throw there strands the request, so make it visible.
  void chain.catch(error =>
    console.error('openWindow: post-open handling failed', error)
  );
}
