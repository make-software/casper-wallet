import { useMemo } from 'react';

import { createOpenWindow } from '@background/create-open-window';

/**
 * Opens a deliberately separate window from a UI page (the import-account
 * flows). It passes NO tracking inputs: both consumers pass `isNewWindow: true`,
 * which makes the reuse branch, `setWindowId` and `clearWindowId` unreachable
 * anyway — and wiring them meant a UI page dispatching `windowIdChanged` into
 * the background store, i.e. retargeting the shared approval-window slot the
 * request lifecycle depends on. That slot is background-only, and the two
 * actions are excluded from the forwarding set accordingly.
 */
export function useWindowManager() {
  const openWindow = useMemo(() => createOpenWindow(), []);

  return { openWindow };
}
