import { createReducer } from 'typesafe-actions';

import {
  accountBalanceChanged,
  accountCasperActivityChanged,
  accountCasperActivityCountChanged,
  accountCasperActivityUpdated,
  accountCurrencyRateChanged,
  accountDeploysAdded,
  accountDeploysCountChanged,
  accountDeploysUpdated,
  accountErc20Changed,
  accountErc20TokensActivityChanged,
  accountErc20TokensActivityUpdated,
  accountInfoReset,
  accountNftTokensAdded,
  accountNftTokensCountChanged,
  accountNftTokensUpdated,
  accountPendingTransactionsChanged,
  accountPendingTransactionsRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from './actions';
import { AccountInfoState } from './types';

const initialState: AccountInfoState = {
  balance: {
    liquidMotes: null,
    delegatedMotes: null,
    undelegatingMotes: null,
    totalBalanceMotes: null,
    totalBalanceFiat: null
  },
  currencyRate: null,
  accountCasperActivity: [],
  accountErc20TokensActivity: null,
  pendingTransactions: [],
  erc20Tokens: [],
  accountDeploys: [],
  accountNftTokens: [],
  nftTokensCount: 0,
  accountDeploysCount: 0,
  accountCasperActivityCount: 0,
  accountTrackingIdOfSentNftTokens: {}
};

export const reducer = createReducer(initialState)
  .handleAction(accountInfoReset, () => initialState)
  .handleAction(accountBalanceChanged, (state, { payload }) => ({
    ...state,
    balance: payload
  }))
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
    (
      state,
      { payload: { contractPackageHash, activityList, tokenActivityCount } }
    ) => ({
      ...state,
      accountErc20TokensActivity: {
        ...state.accountErc20TokensActivity,
        [contractPackageHash]: {
          tokenActivityCount,
          tokenActivityList: activityList
        }
      }
    })
  )
  .handleAction(
    accountErc20TokensActivityUpdated,
    (
      state,
      { payload: { activityList, contractPackageHash, tokenActivityCount } }
    ) => {
      const tokensActivity = state.accountErc20TokensActivity || {};

      return {
        ...state,
        accountErc20TokensActivity: {
          ...state.accountErc20TokensActivity,
          [contractPackageHash]: tokensActivity[contractPackageHash]
            ? {
                tokenActivityCount,
                tokenActivityList: [
                  ...tokensActivity[contractPackageHash].tokenActivityList,
                  ...activityList
                ]
              }
            : {
                tokenActivityCount,
                tokenActivityList: activityList
              }
        }
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
  .handleAction(accountDeploysAdded, (state, { payload }) => ({
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
    accountNftTokens:
      state.accountNftTokens != null
        ? [...state.accountNftTokens, ...payload]
        : payload
  }))
  .handleAction(accountNftTokensCountChanged, (state, { payload }) => ({
    ...state,
    nftTokensCount: payload
  }))
  .handleAction(accountDeploysCountChanged, (state, { payload }) => ({
    ...state,
    accountDeploysCount: payload
  }))
  .handleAction(accountCasperActivityCountChanged, (state, { payload }) => ({
    ...state,
    accountCasperActivityCount: payload
  }))
  .handleAction(
    accountTrackingIdOfSentNftTokensChanged,
    (state, { payload: { trackingId, deployHash } }) => ({
      ...state,
      accountTrackingIdOfSentNftTokens: {
        ...state.accountTrackingIdOfSentNftTokens,
        [trackingId]: deployHash
      }
    })
  )
  .handleAction(
    accountTrackingIdOfSentNftTokensRemoved,
    (state, { payload }) => {
      const accountTrackingIdOfSentNftTokens = {
        ...state.accountTrackingIdOfSentNftTokens
      };
      delete accountTrackingIdOfSentNftTokens[payload];

      return {
        ...state,
        accountTrackingIdOfSentNftTokens
      };
    }
  );
