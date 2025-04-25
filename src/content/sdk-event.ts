import { ActionType, createAction } from 'typesafe-actions';

import { CasperWalletState } from './sdk-types';

// Event emitted to connected sites

export const sdkEvent = {
  connectedAccountEvent: createAction(
    'connectedAccountEvent'
  )<CasperWalletState>(),
  disconnectedAccountEvent: createAction(
    'disconnectedAccountEvent'
  )<CasperWalletState>(),
  changedTab: createAction('changedTabEvent')<CasperWalletState>(),
  changedConnectedAccountEvent: createAction(
    'changedConnectedAccountEvent'
  )<CasperWalletState>(),
  lockedEvent: createAction('lockedEvent')<CasperWalletState>(),
  unlockedEvent: createAction('unlockedEvent')<CasperWalletState>(),
  changedActiveAccountSupportsEvent: createAction(
    'changedActiveAccountSupportsEvent'
  )<CasperWalletState>()
};

export type SdkEvent = ActionType<typeof sdkEvent>;
