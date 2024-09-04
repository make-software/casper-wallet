import { RootState } from 'typesafe-actions';

export const selectAccountBalance = (state: RootState) =>
  state.accountInfo.balance;

export const selectAccountCurrencyRate = (state: RootState) =>
  state.accountInfo.currencyRate;

export const selectAccountCsprTransferDeploysData = (state: RootState) =>
  state.accountInfo.csprTransferDeploysData;

export const selectAccountCep18TransferDeploysData = (state: RootState) =>
  state.accountInfo.cep18TransferDeploysData;

export const selectPendingDeployHashes = (state: RootState) =>
  state.accountInfo.pendingDeployHashes;

export const selectErc20Tokens = (state: RootState) =>
  state.accountInfo.erc20Tokens;

export const selectAccountDeploysData = (state: RootState) =>
  state.accountInfo.accountDeploysData;

export const selectAccountNftTokens = (state: RootState) =>
  state.accountInfo.accountNftTokens;

export const selectAccountNftTokensCount = (state: RootState) =>
  state.accountInfo.nftTokensCount;

export const selectAccountDeploysCount = (state: RootState) =>
  state.accountInfo.accountDeploysCount;

export const selectAccountCasperActivityCount = (state: RootState) =>
  state.accountInfo.accountCasperActivityCount;

export const selectAccountTrackingIdOfSentNftTokens = (state: RootState) =>
  state.accountInfo.accountTrackingIdOfSentNftTokens;
