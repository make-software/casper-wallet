import { runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

/**
 * Heartbeat period for the service-worker anchor. Must stay comfortably under
 * Chrome's 30s service-worker idle deadline.
 *
 * @public consumed by the test via jest.requireActual, which knip can't trace
 */
export const ANCHOR_HEARTBEAT_INTERVAL = 20_000;

// This module is re-evaluated on every MV3 service-worker start, so this flag
// being `true` means no anchored crypto flow has run since the last (re)start.
// The first anchored flow after a start therefore logs a cold-start breadcrumb
// and clears the flag.
let swStartIsFresh = true;

// Refcount of currently anchored flows sharing the single heartbeat interval —
// anchored sagas can overlap (e.g. an account change fires the vault
// re-encrypt saga while another flow is still running).
let anchorCount = 0;
let heartbeatIntervalId: ReturnType<typeof setInterval> | undefined;

/**
 * Keeps the Chrome MV3 background service worker alive across a long crypto
 * section (argon2 key derivation, vault encrypt/decrypt) by calling a cheap
 * extension API every {@link ANCHOR_HEARTBEAT_INTERVAL} ms — each extension
 * API call resets the SW's 30s idle timer (Chrome 110+). Merely holding a
 * `runtime.connect` Port open does NOT reset the timer (Chrome 114+), so an
 * API-call heartbeat is used instead of a Port anchor.
 *
 * No-op on Firefox/Safari: their MV2 background pages are persistent, and the
 * `isChromeBuild` gate keeps Chrome-only machinery from running there.
 *
 * Call before the crypto body; invoke the returned disposer in `finally`.
 * Overlapping anchors share one interval via refcounting, and the disposer is
 * idempotent.
 */
export function anchorServiceWorker(flow: string): () => void {
  if (!isChromeBuild) {
    return () => undefined;
  }

  if (swStartIsFresh) {
    swStartIsFresh = false;
    // Breadcrumb: this crypto flow is the first since the SW (re)started —
    // if it follows a mid-flow kill, this marks the resume point.
    console.debug(`[keepalive] SW resumed mid-${flow}`);
  }

  anchorCount += 1;

  if (heartbeatIntervalId === undefined) {
    heartbeatIntervalId = setInterval(() => {
      // The API call itself is the point — it resets the SW idle timer.
      // The result is ignored and failures are irrelevant to the anchor.
      runtime.getPlatformInfo().catch(() => undefined);
    }, ANCHOR_HEARTBEAT_INTERVAL);
  }

  let released = false;

  return () => {
    if (released) {
      return;
    }
    released = true;

    anchorCount -= 1;

    if (anchorCount === 0 && heartbeatIntervalId !== undefined) {
      clearInterval(heartbeatIntervalId);
      heartbeatIntervalId = undefined;
    }
  };
}
