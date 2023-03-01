import { ActionType, createAction } from 'typesafe-actions';

export const walletRuntimeEvent = {
  updateActiveOrigin: createAction('updateActiveOrigin')()
};

export const WalletRuntimeEventType = {
  UpdateActiveOrigin: 'updateActiveOrigin'
};

export const walletRuntimeEventList = ['updateActiveOrigin'];

export type WalletRuntimeEvent = ActionType<typeof walletRuntimeEvent>;
