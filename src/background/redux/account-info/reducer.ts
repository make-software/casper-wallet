import { createReducer } from 'typesafe-actions';

import { AccountInfoState } from './types';
import {
  accountActivityChanged,
  accountActivityReset,
  accountActivityUpdated,
  accountBalanceChanged,
  accountCurrencyRateChanged
} from './actions';

const initialState: AccountInfoState = {
  balance: {
    amountMotes: null,
    amountFiat: null
  },
  currencyRate: null,
  accountActivity: null
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
  }));
