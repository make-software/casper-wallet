import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountCasperActivityChanged,
  accountInfoReset,
  accountCasperActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged,
  accountErc20TokensActivityChanged,
  accountErc20TokensActivityUpdated,
  accountPendingTransactionsChanged,
  accountPendingTransactionsRemove,
  accountErc20Changed,
  accountDeploysChanged,
  accountDeploysUpdated,
  accountNftTokensAdded,
  accountNftTokensUpdated,
  accountNftTokensCountChanged
} from './actions';

const initialState: AccountInfoState = {
  balance: {
    amountMotes: null,
    amountFiat: null
  },
  currencyRate: null,
  accountCasperActivity: null,
  accountErc20TokensActivity: null,
  pendingTransactions: [],
  erc20Tokens: [],
  accountDeploys: null,
  accountNftTokens: [],
  nftTokensCount: 0
};

export const reducer = createReducer(initialState)
  .handleAction(accountInfoReset, () => initialState)
  .handleAction(
    accountBalanceChanged,
    (state, { payload }): AccountInfoState => ({
      ...state,
      balance: payload
    })
  )
  .handleAction(
    accountCurrencyRateChanged,
    (state, { payload }): AccountInfoState => ({
      ...state,
      currencyRate: payload
    })
  )
  .handleAction(
    accountErc20Changed,
    (state, { payload }): AccountInfoState => ({
      ...state,
      erc20Tokens: payload
    })
  )
  .handleAction(
    accountCasperActivityChanged,
    (state, { payload }): AccountInfoState => ({
      ...state,
      accountCasperActivity: payload
    })
  )
  .handleAction(accountCasperActivityUpdated, (state, { payload }) => ({
    ...state,
    accountCasperActivity:
      state.accountCasperActivity != null
        ? [...state.accountCasperActivity, ...payload]
        : payload
  }))
  .handleAction(
    accountErc20TokensActivityChanged,
    (state, { payload: { contractPackageHash, activityList } }) => ({
      ...state,
      accountErc20TokensActivity: {
        ...state.accountErc20TokensActivity,
        [contractPackageHash]: activityList
      }
    })
  )
  .handleAction(
    accountErc20TokensActivityUpdated,
    (state, { payload: { activityList, contractPackageHash } }) => ({
      ...state,
      accountErc20TokensActivity: {
        ...state.accountErc20TokensActivity,
        [contractPackageHash]:
          state.accountErc20TokensActivity &&
          state.accountErc20TokensActivity[contractPackageHash]
            ? [
                ...state.accountErc20TokensActivity[contractPackageHash],
                ...activityList
              ]
            : activityList
      }
    })
  )
  .handleAction(accountPendingTransactionsChanged, (state, { payload }) => {
    const pendingTransactions = {
      ...payload,
      id: payload.deployHash
    };

    return {
      ...state,
      pendingTransactions:
        state.pendingTransactions?.length > 0
          ? [pendingTransactions, ...state.pendingTransactions]
          : [pendingTransactions]
    };
  })
  .handleAction(accountPendingTransactionsRemove, (state, { payload }) => ({
    ...state,
    pendingTransactions: state.pendingTransactions.filter(
      transaction => transaction.deployHash !== payload
    )
  }))
  .handleAction(accountDeploysChanged, (state, { payload }) => ({
    ...state,
    accountDeploys: payload
  }))
  .handleAction(accountDeploysUpdated, (state, { payload }) => ({
    ...state,
    accountDeploys:
      state.accountDeploys != null
        ? [...state.accountDeploys, ...payload]
        : payload
  }))
  .handleAction(accountNftTokensAdded, (state, { payload }) => ({
    ...state,
    accountNftTokens: payload
  }))
  .handleAction(accountNftTokensUpdated, (state, { payload }) => ({
    ...state,
    accountNftTokens: [...state.accountNftTokens, ...payload]
  }))
  .handleAction(accountNftTokensCountChanged, (state, { payload }) => ({
    ...state,
    nftTokensCount: payload
  }));
