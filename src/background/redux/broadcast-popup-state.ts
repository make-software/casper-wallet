import { runtime } from 'webextension-polyfill';

import {
  BackgroundEvent,
  backgroundEvent
} from '@background/background-events';
import { selectPopupState } from '@background/redux/popup-state';
import { RootState } from '@background/redux/store-types';

// Only "no receiver" is expected — it means no popup is open. Everything else
// means an open replica just missed an update and is now silently stale.
function broadcastToReplicas(message: BackgroundEvent, source: string): void {
  runtime.sendMessage(message).catch((error: unknown) => {
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes('Receiving end does not exist')) {
      return;
    }
    // The payload still carries account and session data, so it is never
    // logged — only a static source label and the error object.
    console.error(`${source} broadcast failed:`, error);
  });
}

export function broadcastPopupState(state: RootState): void {
  broadcastToReplicas(
    backgroundEvent.popupStateUpdated(selectPopupState(state)),
    'popupStateUpdated'
  );
}
