import { createReducer } from 'typesafe-actions';

import { isEqualCaseInsensitive } from '@src/utils';

import {
  accountErc20Changed,
  accountInfoReset,
  accountNftTokensAdded,
  accountNftTokensCountChanged,
  accountNftTokensUpdated,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from './actions';
import { AccountInfoState } from './types';

const initialState: AccountInfoState = {
  pendingDeployHashes: [],
  erc20Tokens: [],
  accountNftTokens: [],
  nftTokensCount: 0,
  accountTrackingIdOfSentNftTokens: {}
};

export const reducer = createReducer(initialState)
  .handleAction(accountInfoReset, () => initialState)
  .handleAction(
    accountErc20Changed,
    (state, { payload }): AccountInfoState => ({
      ...state,
      erc20Tokens: payload
    })
  )
  .handleAction(accountPendingDeployHashesChanged, (state, { payload }) => {
    return {
      ...state,
      pendingDeployHashes: [payload, ...state.pendingDeployHashes]
    };
  })
  .handleAction(accountPendingDeployHashesRemove, (state, { payload }) => ({
    ...state,
    pendingDeployHashes: state.pendingDeployHashes.filter(
      deploy => !isEqualCaseInsensitive(deploy, payload)
    )
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
