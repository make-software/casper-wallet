import { RootState } from 'typesafe-actions';

export const selectAccountBalance = (state: RootState) =>
  state.accountInfo.balance;

export const selectAccountCurrencyRate = (state: RootState) =>
  state.accountInfo.currencyRate;

export const selectAccountCasperActivity = (state: RootState) =>
  state.accountInfo.accountCasperActivity;

export const selectAccountErc20TokensActivity = (state: RootState) =>
  state.accountInfo.accountErc20TokensActivity;

export const selectPendingTransactions = (state: RootState) =>
  state.accountInfo.pendingTransactions;

export const selectErc20Tokens = (state: RootState) =>
  state.accountInfo.erc20Tokens;

export const selectAccountDeploys = (state: RootState) =>
  state.accountInfo.accountDeploys;

export const selectAccountNftTokens = (state: RootState) =>
  state.accountInfo.accountNftTokens;
