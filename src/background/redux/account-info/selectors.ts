import { RootState } from 'typesafe-actions';

export const selectAccountBalance = (state: RootState) =>
  state.accountInfo.balance;

export const selectAccountCurrencyRate = (state: RootState) =>
  state.accountInfo.currencyRate;

export const selectAccountActivity = (state: RootState) =>
  state.accountInfo.accountActivity;

export const selectAccountErc20Activity = (state: RootState) =>
  state.accountInfo.accountErc20Activity;

export const selectPendingTransactions = (state: RootState) =>
  state.accountInfo.pendingTransactions;
