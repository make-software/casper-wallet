import { createAction } from '@reduxjs/toolkit';

import { CasperWalletState } from './sdk-types';

// Event emitted to connected sites

export const sdkEvent = {
  connectedAccountEvent: createAction<CasperWalletState>(
    'connectedAccountEvent'
  ),
  disconnectedAccountEvent: createAction<CasperWalletState>(
    'disconnectedAccountEvent'
  ),
  changedTab: createAction<CasperWalletState>('changedTabEvent'),
  changedConnectedAccountEvent: createAction<CasperWalletState>(
    'changedConnectedAccountEvent'
  ),
  lockedEvent: createAction<CasperWalletState>('lockedEvent'),
  unlockedEvent: createAction<CasperWalletState>('unlockedEvent'),
  changedActiveAccountSupportsEvent: createAction<CasperWalletState>(
    'changedActiveAccountSupportsEvent'
  )
};

export type SdkEvent = ReturnType<(typeof sdkEvent)[keyof typeof sdkEvent]>;
