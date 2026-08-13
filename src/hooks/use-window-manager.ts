import { useMemo } from 'react';

import {
  OpenWindowProps,
  createOpenWindow
} from '@background/create-open-window';

import { reportUiError } from '@libs/ui/components/saga-error-banner/ui-error-channel';

/**
 * Opens a deliberately separate window from a UI page (the import-account
 * flows). It passes NO tracking inputs: both consumers pass `isNewWindow: true`,
 * which makes the reuse branch, `setWindowId` and `clearWindowId` unreachable
 * anyway — and wiring them meant a UI page dispatching `windowIdChanged` into
 * the background store, i.e. retargeting the shared approval-window slot the
 * request lifecycle depends on. That slot is background-only, and the two
 * actions are excluded from the forwarding set accordingly.
 *
 * The returned `openWindow` never rejects: it reports the failure to the error
 * banner itself, so no call site can go back to discarding it.
 */
export function useWindowManager() {
  const openWindow = useMemo(() => {
    const open = createOpenWindow();

    return async (props: OpenWindowProps) => {
      try {
        await open(props);
      } catch (error) {
        // Name only, not the rejection: `searchParams` is embedded in the URL
        // `windows.create` was given, and a sign-message plaintext can ride
        // there. `use-ledger.ts` logs `error.name` for the same reason.
        console.error(
          'openWindow failed',
          props.windowApp,
          (error as Error)?.name
        );
        reportUiError('window-open-failed', props.windowApp);
      }
    };
  }, []);

  return { openWindow };
}
