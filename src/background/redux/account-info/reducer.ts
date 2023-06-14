import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountActivityChanged,
  accountActivityReset,
  accountActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged,
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
