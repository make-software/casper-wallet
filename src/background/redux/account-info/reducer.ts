import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountActivityChanged,
  accountActivityReset,
  accountActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged,
  accountErc20ActivityChanged,
  accountErc20ActivityUpdated,
  accountPendingTransactionsChanged,
  accountPendingTransactionsRemove
} from './actions';

const initialState: AccountInfoState = {
  balance: {
    amountMotes: null,
    amountFiat: null
  },
  currencyRate: null,
  accountActivity: null,
  accountErc20Activity: null,
  pendingTransactions: []
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
    accountActivityChanged,
    (state, { payload }): AccountInfoState => ({
      ...state,
      accountActivity: payload
    })
  )
  .handleAction(accountActivityUpdated, (state, { payload }) => ({
    ...state,
    accountActivity:
      state.accountActivity != null
        ? [...state.accountActivity, ...payload]
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
      id: payload.deploy_hash
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
      transaction => transaction.deploy_hash !== payload
    )
  }));
