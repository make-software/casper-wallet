import { RootState } from 'typesafe-actions';

export const selectPendingDeployHashes = (state: RootState) =>
  state.accountInfo.pendingDeployHashes;

export const selectAccountTrackingIdOfSentNftTokens = (state: RootState) =>
  state.accountInfo.accountTrackingIdOfSentNftTokens;
