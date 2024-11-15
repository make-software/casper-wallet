import { createReducer } from 'typesafe-actions';

import { isEqualCaseInsensitive } from '@src/utils';

import {
  accountInfoReset,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from './actions';
import { AccountInfoState } from './types';

const initialState: AccountInfoState = {
  pendingDeployHashes: [],
  accountTrackingIdOfSentNftTokens: {}
};

export const reducer = createReducer(initialState)
  .handleAction(accountInfoReset, () => initialState)
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
