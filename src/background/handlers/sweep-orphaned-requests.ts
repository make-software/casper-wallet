import { collectRequestIdsFromOpenWindows } from '@background/open-request-windows';
import { redactUrlQuery } from '@background/redact-url-query';
import type { MainStore } from '@background/redux/get-main-store';
import { MAX_SESSION_ROWS } from '@background/redux/windowManagement/session-store';
import { WindowManagementState } from '@background/redux/windowManagement/types';

import { CANCEL_GRACE_MS, failRequestOnWindowError } from './cancel-requests';

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Cancels every hydrated 'open' row no window still displays; left uncancelled
 * it permanently occupies one of the `MAX_STORED_PAYLOADS` slots.
 * `hydratedRequests` is the init snapshot — reading `store.getState()` after an
 * await could cancel a request still in its own registration→attach gap.
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

  // `init` runs on every wake, so a full tab enumeration must not run when
  // there is nothing to sweep.
  if (openRows.length === 0) {
    return;
  }

  const liveRequestIds = await collectRequestIdsFromOpenWindows();

  // `null` is a failed enumeration, not "no window displays anything" — fail
  // closed, same as `reconcileStalePayloadsSaga`.
  if (liveRequestIds == null) {
    return;
  }

  // Liveness is a window-URL question, never a `windowIds` question: a row can
  // read `windowIds: []` while its approval window is genuinely on screen.
  const orphaned = openRows.filter(
    ({ requestId }) => !liveRequestIds.has(requestId)
  );

  if (orphaned.length === 0) {
    return;
  }

  // Bound the work per wake to the session write cap; a row past the cut stays
  // 'open' and is re-swept on the next wake regardless.
  const toSweep = orphaned
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .slice(0, MAX_SESSION_ROWS);

  // A Ledger confirmation runs in the window's document, not the worker, so a
  // genuine signed response can still be in flight; the grace lets it land.
  await delay(CANCEL_GRACE_MS);

  await Promise.allSettled(
    toSweep.map(({ requestId }) =>
      failRequestOnWindowError(
        store,
        requestId,
        'sweep-orphaned-requests'
      ).catch(error =>
        // Identifiers + `redactUrlQuery` only — the raw error may wrap a
        // rejection echoing a signMessage window's plaintext query string.
        console.error('sweep-orphaned-requests: cancel failed', {
          requestId,
          error: redactUrlQuery(error)
        })
      )
    )
  );
}
