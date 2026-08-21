import { runtime } from 'webextension-polyfill';

import {
  BackgroundEvent,
  backgroundEvent
} from '@background/background-events';
import { selectPopupState } from '@background/redux/popup-state';
import { RootState } from '@background/redux/store-types';

// Only "no receiver" is expected: `runtime.sendMessage` delivers to every
// extension context except the sender, so with no popup open Chrome rejects
// with "Receiving end does not exist." Everything else — a structured-clone
// failure, a throwing listener, a message-size limit — means an OPEN replica
// just missed an update and is now silently stale, so it must be visible.
// Same idiom as keep-alive.ts.
function broadcastToReplicas(message: BackgroundEvent, source: string): void {
  runtime.sendMessage(message).catch((error: unknown) => {
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes('Receiving end does not exist')) {
      return;
    }
    // The broadcast payload is sanitized but still carries account and session
    // data, so it is never logged — only a static source label and the error object.
    console.error(`${source} broadcast failed:`, error);
  });
}

export function broadcastPopupState(state: RootState): void {
  broadcastToReplicas(
    backgroundEvent.popupStateUpdated(selectPopupState(state)),
    'popupStateUpdated'
  );
}
