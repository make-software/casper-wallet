import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountCasperActivityChanged,
  accountActivityReset,
  accountCasperActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged,
  accountErc20ActivityChanged,
  accountErc20ActivityUpdated,
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
  accountErc20Activity: null,
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
    accountErc20ActivityChanged,
    (state, { payload }): AccountInfoState => ({
      ...state,
      accountErc20Activity: payload
    })
  )
  .handleAction(accountErc20ActivityUpdated, (state, { payload }) => ({
    ...state,
    accountErc20Activity:
      state.accountErc20Activity != null
        ? [...state.accountErc20Activity, ...payload]
        : payload
  }))
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
