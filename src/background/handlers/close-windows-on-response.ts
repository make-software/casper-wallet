import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { getRequest } from '@background/redux/windowManagement/request-map';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';

export interface RespondedDisplays {
  readonly windowIds: readonly number[];
  readonly isLedgerFlow: boolean;
  readonly permissionWindowId: number | null;
}

export const NOTHING_DISPLAYS: RespondedDisplays = {
  windowIds: [],
  isLedgerFlow: false,
  permissionWindowId: null
};

// The last instant at which `windowIds` exists.
export function markRequestResponded(
  store: MainStore,
  requestId: string
): RespondedDisplays {
  const state = store.getState();
  const request = getRequest(state.windowManagement.requests, requestId);

  if (request?.status !== 'open') {
    return NOTHING_DISPLAYS;
  }

  const permissionWindowId = state.ledger.windowId;
  const displays: RespondedDisplays = {
    windowIds: request.windowIds,
    isLedgerFlow:
      permissionWindowId != null &&
      request.windowIds.includes(permissionWindowId),
    permissionWindowId
  };

  store.dispatch(windowRequestResponded({ requestId }));

  return displays;
}

// Subtracts what other open requests claim now, not at snapshot time.
export async function closeLedgerWindowsAfterResponse(
  store: MainStore,
  displays: RespondedDisplays
): Promise<void> {
  try {
    if (!displays.isLedgerFlow) return;

    const claimedByOthers = new Set<number>();
    for (const openRequest of selectOpenRequests(store.getState())) {
      for (const windowId of openRequest.windowIds) {
        claimedByOthers.add(windowId);
      }
    }

    const targets = displays.windowIds.filter(id => !claimedByOthers.has(id));

    if (targets.length === 0) return;

    // Only if the slice still names the window we are removing — another flow may
    // have claimed the slot during the delivery await.
    if (
      displays.permissionWindowId != null &&
      targets.includes(displays.permissionWindowId) &&
      store.getState().ledger.windowId === displays.permissionWindowId
    ) {
      store.dispatch(ledgerStateCleared());
    }

    await Promise.allSettled(
      targets.map(async windowId => {
        try {
          await windows.remove(windowId);
        } catch (error) {
          // Ids only: a signMessage permission URL embeds the user's plaintext message.
          console.error(
            'close-on-response: window removal failed',
            { windowId },
            error
          );
        }
      })
    );
  } catch (error) {
    console.error('close-on-response: failed', error);
  }
}
