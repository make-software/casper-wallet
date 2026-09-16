import type { OpenWindowProps } from '@background/create-open-window';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

/**
 * Wraps `createOpenWindow`'s result so a failed open reports itself instead of
 * being swallowed at the call site.
 */
export function createReportingOpenWindow(
  open: (props: OpenWindowProps) => Promise<unknown>
) {
  return async (props: OpenWindowProps): Promise<void> => {
    try {
      await open(props);
      clearUiError('window-open-failed', props.windowApp);
    } catch (error) {
      // The name only, never the rejection and never `props`: `searchParams` rides
      // in the URL `windows.create` was given, and can hold a sign-message plaintext.
      console.error(
        'openWindow failed',
        props.windowApp,
        (error as Error)?.name
      );
      reportUiError('window-open-failed', props.windowApp);
    }
  };
}
