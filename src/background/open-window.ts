import {
  OpenWindowProps,
  createOpenWindow
} from '@background/create-open-window';
import { attachWindowToRequest } from '@background/handlers/attach-window-to-request';
import {
  cancelRequestsDisplacedBy,
  failRequestOnWindowError
} from '@background/handlers/cancel-requests';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

export interface OpenApprovalWindowProps extends OpenWindowProps {
  /** Set for dapp approval flows; absent for internal (non-approval) windows. */
  requestId?: string;
}

// Fire-and-forget by design (the message handler must not block on a browser
// window), but every terminal state is now handled:
//   reused   → the displaced request loses its last window and is cancelled
//   opened   → the window is attached to the request
//   no id    → the request is cancelled and the dapp is told (see below)
//   rejected → the request is cancelled and the dapp is told, instead of
//              hanging until its own 30-minute timeout
export function openWindow(
  store: MainStore,
  { requestId, ...openWindowProps }: OpenApprovalWindowProps
) {
  // Fire-and-forget recovery shared by every "no window will ever display this
  // request" outcome: log identifiers only (never the action/payload) and, for
  // dapp approval flows, fail the request so its dapp promise doesn't hang
  // until its own 30-minute timeout.
  const failIncomingRequest = (context: string, details: unknown) => {
    console.error(context, details);

    if (requestId != null) {
      void failRequestOnWindowError(store, requestId).catch(err =>
        console.error('open-window-failed: recovery failed', err)
      );
    }
  };

  createOpenWindow({
    windowId: selectWindowId(store.getState()),
    setWindowId: (id: number) => store.dispatch(windowIdChanged(id)),
    clearWindowId: () => store.dispatch(windowIdCleared())
  })(openWindowProps).then(
    ({ window, reused }) => {
      if (window.id == null) {
        // No `windows.onRemoved` will ever fire for a window without an id, so
        // without this the request is silently stranded: it stays 'open' with
        // no attached window, and nothing will ever cancel it.
        failIncomingRequest('openWindow: resolved window has no id', {
          requestId
        });
        return;
      }

      const windowId = window.id;

      // Runs BEFORE the attach below: it snapshots its candidates and dispatches
      // the detach synchronously, so the incoming request — which has no window
      // yet on its first `windowRequestOpened` — can never be among them. (The
      // one exception is a dapp re-sending an already-attached `requestId`:
      // `windowRequestOpened` no-ops on a duplicate, so "incoming" there is
      // really the same already-open request, and it would be cancelled by its
      // own supersede. That's dapp-controlled, not a regression.)
      if (reused) {
        void cancelRequestsDisplacedBy(
          store,
          windowId,
          'cancel-on-supersede'
        ).catch(error => console.error('cancel-on-supersede: failed', error));
      }

      if (requestId != null) {
        // The reuse chain makes several browser round-trips (getAll → get →
        // update → tabs.update, see create-open-window.ts) before this `.then`
        // runs, and window creation is itself an awaited round-trip, so the
        // window can close in that gap. `attachWindowToRequest` owns both the
        // dispatch and the liveness repair for that case — see the rationale
        // there, and note the Ledger hook reaches the same helper across a
        // wider gap still.
        attachWindowToRequest(store, requestId, windowId);
      }
    },
    error => {
      // Fire-and-forget: if `windows.create` rejects, surface it instead of an
      // unhandled rejection. The slice's window id is left cleared (no id was
      // set). Never log the raw error: a `signMessage` window URL embeds the
      // user's plaintext message as a query param, and a rejection's error
      // text can echo the URL it failed on — log only the error's name.
      failIncomingRequest('openWindow: failed to open approval window', {
        requestId,
        errorName: (error as Error)?.name
      });
    }
  );
}
