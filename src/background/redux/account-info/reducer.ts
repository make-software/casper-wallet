import { createReducer } from 'typesafe-actions';

import { isEqualCaseInsensitive } from '@src/utils';

import {
  accountBalanceChanged,
  accountCasperActivityCountChanged,
  accountCep18TransferDeploysDataChanged,
  accountCsprTransferDeploysDataChanged,
  accountCurrencyRateChanged,
  accountDeploysCountChanged,
  accountDeploysDataChanged,
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
  balance: {
    liquidMotes: null,
    delegatedMotes: null,
    undelegatingMotes: null,
    totalBalanceMotes: null,
    totalBalanceFiat: null
  },
  currencyRate: null,
  csprTransferDeploysData: null,
  cep18TransferDeploysData: null,
  pendingDeployHashes: [],
  erc20Tokens: [],
  accountDeploysData: null,
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
    accountCsprTransferDeploysDataChanged,
    (state, { payload }): AccountInfoState => {
      const csprTransferDeploysData = state.csprTransferDeploysData;

      if (
        payload &&
        csprTransferDeploysData &&
        payload.pages[0].itemCount > csprTransferDeploysData.pages[0].itemCount
      ) {
        return {
          ...state,
          csprTransferDeploysData: payload
        };
      }

      if (
        payload &&
        csprTransferDeploysData?.pageParams &&
        payload.pageParams.length < csprTransferDeploysData.pageParams.length
      ) {
        const updatedDeploysData = { ...csprTransferDeploysData };

        payload.pageParams.forEach((pageParam, index) => {
          const element = csprTransferDeploysData?.pageParams.find(
            el => el === pageParam
          );
          if (!element) {
            updatedDeploysData.pageParams.push(pageParam);
            updatedDeploysData.pages.push(payload.pages[index]);
          }
        });

        return {
          ...state,
          csprTransferDeploysData: updatedDeploysData
        };
      }

      return {
        ...state,
        csprTransferDeploysData: payload
      };
    }
  )
  .handleAction(
    accountCep18TransferDeploysDataChanged,
    (
      state,
      {
        payload: { cep18TransferDeploysData: payloadData, contractPackageHash }
      }
    ) => {
      const cep18TransferDeploysData = state.cep18TransferDeploysData || {};
      const deploy = cep18TransferDeploysData[contractPackageHash];

      if (
        payloadData &&
        deploy &&
        payloadData.pages[0].itemCount > deploy.pages[0].itemCount
      ) {
        return {
          ...state,
          cep18TransferDeploysData: {
            ...state.cep18TransferDeploysData,
            [contractPackageHash]: payloadData
          }
        };
      }

      if (
        payloadData &&
        deploy &&
        payloadData.pageParams.length < deploy.pageParams.length
      ) {
        const updatedDeploy = { ...deploy };
        payloadData.pageParams.forEach((pageParam, index) => {
          const element = deploy?.pageParams.find(el => el === pageParam);

          if (!element) {
            updatedDeploy.pageParams.push(pageParam);
            updatedDeploy.pages.push(payloadData.pages[index]);
          }
        });

        return {
          ...state,
          cep18TransferDeploysData: {
            [contractPackageHash]: updatedDeploy
          }
        };
      }

      return {
        ...state,
        cep18TransferDeploysData: {
          ...state.cep18TransferDeploysData,
          [contractPackageHash]: payloadData
        }
      };
    }
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
  .handleAction(accountDeploysDataChanged, (state, { payload }) => {
    const stateDeploysData = state.accountDeploysData;

    if (
      payload &&
      stateDeploysData &&
      payload.pages[0].item_count > stateDeploysData.pages[0].item_count
    ) {
      return {
        ...state,
        accountDeploysData: payload
      };
    }

    if (
      payload &&
      stateDeploysData?.pageParams &&
      payload.pageParams.length < stateDeploysData.pageParams.length
    ) {
      const updatedDeploysData = { ...stateDeploysData };

      payload.pageParams.forEach((pageParam, index) => {
        const element = stateDeploysData?.pageParams.find(
          el => el === pageParam
        );

        if (!element) {
          updatedDeploysData.pageParams.push(pageParam);
          updatedDeploysData.pages.push(payload.pages[index]);
        }
      });

      return {
        ...state,
        accountDeploysData: updatedDeploysData
      };
    }

    return {
      ...state,
      accountDeploysData: payload
    };
  })
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
