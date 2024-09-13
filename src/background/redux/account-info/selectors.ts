import { RootState } from 'typesafe-actions';

export const selectAccountBalance = (state: RootState) =>
  state.accountInfo.balance;

export const selectAccountCurrencyRate = (state: RootState) =>
  state.accountInfo.currencyRate;

export const selectPendingDeployHashes = (state: RootState) =>
  state.accountInfo.pendingDeployHashes;

export const selectErc20Tokens = (state: RootState) =>
  state.accountInfo.erc20Tokens;

export const selectAccountNftTokens = (state: RootState) =>
  state.accountInfo.accountNftTokens;

export const selectAccountNftTokensCount = (state: RootState) =>
  state.accountInfo.nftTokensCount;

export const selectAccountTrackingIdOfSentNftTokens = (state: RootState) =>
  state.accountInfo.accountTrackingIdOfSentNftTokens;
