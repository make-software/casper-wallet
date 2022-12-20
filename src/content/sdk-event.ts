import { ActionType, createAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';
import { SdkMessage } from './sdk-message';

// Event emitted to connected sites

export type WalletState = {
  isLocked: boolean;
  isConnected: boolean;
  activeKey: string | null;
};

export const sdkEvent = {
  connectedAccountEvent: createAction('connectedAccountEvent')<WalletState>(),
  disconnectedAccountEvent: createAction(
    'disconnectedAccountEvent'
  )<WalletState>(),
  changedTab: createAction('changedTabEvent')<WalletState>(),
  changedConnectedAccountEvent: createAction(
    'changedConnectedAccountEvent'
  )<WalletState>()
};

export type SdkEvent = ActionType<typeof sdkEvent>;

export async function emitSdkEventToAllActiveTabs(
  action: SdkEvent | SdkMessage
) {
  const tabs = await browser.tabs.query({
    active: true
  });

  tabs.forEach(async tab => {
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, action);
    } else {
      throw Error('Tab without id: ' + tab);
    }
  });
}
