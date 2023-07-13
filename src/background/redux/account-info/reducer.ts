import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountCasperActivityChanged,
  accountActivityReset,
  accountCasperActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged,
  accountErc20TokensActivityChanged,
  accountErc20TokensActivityUpdated,
  accountPendingTransactionsChanged,
  accountPendingTransactionsRemove,
  accountErc20Changed,
  accountDeploysChanged,
  accountDeploysUpdated
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
  accountDeploys: null
};

export const reducer = createReducer(initialState)
  .handleAction(accountActivityReset, () => initialState)
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
    (state, { payload: { contractPackageHash, activityList } }) => {
      const accountErc20TokensActivity = state.accountErc20TokensActivity || {};

      accountErc20TokensActivity[contractPackageHash] = activityList;

      return {
        ...state,
        accountErc20TokensActivity
      };
    }
  )
  .handleAction(
    accountErc20TokensActivityUpdated,
    (state, { payload: { activityList, contractPackageHash } }) => {
      const accountErc20TokensActivity = state.accountErc20TokensActivity || {};

      accountErc20TokensActivity[contractPackageHash]
        ? (accountErc20TokensActivity[contractPackageHash] = [
            ...accountErc20TokensActivity[contractPackageHash],
            ...activityList
          ])
        : (accountErc20TokensActivity[contractPackageHash] = activityList);

      return {
        ...state,
        accountErc20TokensActivity
      };
    }
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
  }));
