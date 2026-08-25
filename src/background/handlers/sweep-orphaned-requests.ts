import { collectRequestIdsFromOpenWindows } from '@background/open-request-windows';
import { redactUrlQuery } from '@background/redact-url-query';
import type { MainStore } from '@background/redux/get-main-store';
import { MAX_SESSION_ROWS } from '@background/redux/windowManagement/session-store';
import { WindowManagementState } from '@background/redux/windowManagement/types';

import { CANCEL_GRACE_MS, failRequestOnWindowError } from './cancel-requests';

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Cancels every hydrated 'open' row no window still displays (spec §8.1) — the
 * two durable-state freezes `windows.onRemoved` alone can never recover from:
 * an init failure that consumed the only cancelling event, and a crash between
 * a detach and its tombstone that durably persists `{status:'open',
 * windowIds:[]}`. Left uncancelled, the row permanently occupies one of ten
 * `MAX_STORED_PAYLOADS` slots (`vault-sagas.ts`), reopening the leak
 * WALLET-1418 closed.
 *
 * `hydratedRequests` is the snapshot taken at init — NEVER read from
 * `store.getState()` after an await, or a request registered moments ago,
 * still waiting for its window to attach, could be cancelled during its own
 * legitimate registration→attach gap.
 */
export async function sweepOrphanedRequests(
  store: MainStore,
  hydratedRequests: WindowManagementState['requests']
): Promise<void> {
  const openRows = Object.entries(hydratedRequests).flatMap(
    ([requestId, request]) =>
      request != null && request.status === 'open'
        ? [{ requestId, seq: request.seq }]
        : []
  );

  // A user who never touches a dapp hits this on every wake — `init` runs on
  // every wake and `windows.onRemoved` fires for any browser window — so a
  // full tab enumeration must not run when there is nothing to sweep.
  if (openRows.length === 0) {
    return;
  }

  // Unchanged, on purpose: a read-only second caller cannot narrow the Set
  // `reconcileStalePayloadsSaga` consumes, and a second copy would have to
  // independently re-earn its piecewise URL compare, `REQUEST_BEARING_PATHNAMES`,
  // `tab.url || tab.pendingUrl`, the per-tab catch and the `Set | null`
  // contract — then split-brain the moment a new approval page is added. See
  // spec §8.1.
  const liveRequestIds = await collectRequestIdsFromOpenWindows();

  // `null` is a failed enumeration, not "no window displays anything" — fail
  // closed, same as `reconcileStalePayloadsSaga`.
  if (liveRequestIds == null) {
    return;
  }

  // Liveness is a window-URL question, never a `windowIds` question: a row
  // can read `windowIds: []` while its approval window is genuinely on
  // screen (the worker can die between `windowRequestOpened` and the attach
  // that follows `windows.create`), so `windowIds` is never consulted here —
  // only whether some window's URL still names this requestId.
  const orphaned = openRows.filter(
    ({ requestId }) => !liveRequestIds.has(requestId)
  );

  if (orphaned.length === 0) {
    return;
  }

  // Bound the work per wake to the session write cap (`MAX_SESSION_ROWS`,
  // currently 70). The reducer's own `MAX_OPEN_REQUESTS` cap (20) is the real
  // bound on how many open rows a hydrated snapshot can hold; this slice is
  // the outer guard for whatever a stale or pre-cap mirror still carries. A
  // row past the cut stays 'open' and is re-swept on the next wake regardless.
  const toSweep = orphaned
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .slice(0, MAX_SESSION_ROWS);

  // The vehicle's premise — "no window will ever display this request" — does
  // not transfer from the `windows.create`-rejection trigger to the sweep: a
  // Ledger confirmation runs in the window's document, not the worker, so a
  // genuine signed response can be in flight. The grace lets it land and mark
  // the row 'responded' first; `failRequestOnWindowError` re-reads the store
  // fresh, so it sees that and no-ops.
  await delay(CANCEL_GRACE_MS);

  await Promise.allSettled(
    toSweep.map(({ requestId }) =>
      failRequestOnWindowError(
        store,
        requestId,
        'sweep-orphaned-requests'
      ).catch(error =>
        // Identifiers + `redactUrlQuery` only — never the raw error, in case
        // it wraps a rejection that echoes a signMessage window's plaintext
        // query string.
        console.error('sweep-orphaned-requests: cancel failed', {
          requestId,
          error: redactUrlQuery(error)
        })
      )
    )
  );
}
