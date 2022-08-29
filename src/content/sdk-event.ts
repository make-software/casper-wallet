import { ActionType, createAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

// Event emitted to connected sites

export type WalletState = {
  activeKey: string;
  isConnected: boolean;
  isLocked: boolean;
};

// for backward compatibility
export type LegacySignerState = {
  activeKey: string;
  isConnected: boolean;
  isUnlocked: boolean;
};

export const sdkEvent = {
  connectedActiveAccountEvent: createAction(
    'connectedActiveAccountEvent'
  )<WalletState>(),
  disconnectedActiveAccountEvent: createAction(
    'disconnectedActiveAccountEvent'
  )<WalletState>(),
  changedActiveConnectedAccountEvent: createAction(
    'changedActiveConnectedAccountEvent'
  )<WalletState>()
};

export type SdkEvent = ActionType<typeof sdkEvent>;

export async function emitSdkEventToAllActiveTabs(action: SdkEvent) {
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
