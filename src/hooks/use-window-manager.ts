import { useMemo } from 'react';

import { createOpenWindow } from '@background/create-open-window';

import { createReportingOpenWindow } from './create-reporting-open-window';

/**
 * Opens a deliberately separate window from a UI page. It passes no tracking inputs: the shared
 * approval-window slot is background-only. The returned `openWindow` never rejects —
 * `createReportingOpenWindow` reports the failure to the error banner itself.
 */
export function useWindowManager() {
  const openWindow = useMemo(
    () => createReportingOpenWindow(createOpenWindow()),
    []
  );

  return { openWindow };
}
