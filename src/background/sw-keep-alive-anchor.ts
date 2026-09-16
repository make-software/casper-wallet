import { runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

/**
 * Heartbeat period for the service-worker anchor. Must stay comfortably under
 * Chrome's 30s service-worker idle deadline.
 *
 * @public consumed by the test via jest.requireActual, which knip can't trace
 */
export const ANCHOR_HEARTBEAT_INTERVAL = 20_000;

// Re-evaluated on every MV3 service-worker start, so `true` means no anchored
// crypto flow has run since the last (re)start.
let swStartIsFresh = true;

// Refcount of anchored flows sharing the single heartbeat interval — anchored
// sagas can overlap.
let anchorCount = 0;
let heartbeatIntervalId: ReturnType<typeof setInterval> | undefined;

/**
 * Keeps the Chrome MV3 service worker alive across a long crypto section: each
 * extension API call resets the 30s idle timer, while holding a `runtime.connect`
 * Port open does not (Chrome 114+). No-op off Chrome. Call the returned disposer
 * in `finally`; overlapping anchors share one refcounted interval.
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
