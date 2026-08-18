import type { OpenWindowProps } from '@background/create-open-window';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

/**
 * Wraps `createOpenWindow`'s result so a failed open reports itself instead of
 * being swallowed at the call site.
 *
 * Extracted from `useWindowManager` for the same reason as
 * `registerLedgerPermissionWindow`: the repo has no React-hook harness, so
 * inside the hook the redaction below was a line anyone could widen back to
 * logging the rejection — or `props` — with the suite staying green.
 */
export function createReportingOpenWindow(
  open: (props: OpenWindowProps) => Promise<unknown>
) {
  return async (props: OpenWindowProps): Promise<void> => {
    try {
      await open(props);
      clearUiError('window-open-failed', props.windowApp);
    } catch (error) {
      // The name only, never the rejection and never `props`: `searchParams` is
      // embedded in the URL `windows.create` was given, and a sign-message
      // plaintext can ride there. `use-ledger.ts` logs `error.name` for the same
      // reason.
      console.error(
        'openWindow failed',
        props.windowApp,
        (error as Error)?.name
      );
      reportUiError('window-open-failed', props.windowApp);
    }
  };
}
