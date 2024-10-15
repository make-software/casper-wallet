import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import {
  AssociatedKeysContractHash,
  AuctionManagerContractHash,
  AuctionPoolContractHash,
  CSPRMarketContractHash,
  CSPRStudioCep47ContractHash,
  CasperLiveUrl,
  CasperNodeUrl,
  NetworkName,
  NetworkSetting
} from '@src/constants';

export const selectTimeoutDurationSetting = (state: RootState) =>
  state.settings.activeTimeoutDuration;

export const selectActiveNetworkSetting = (state: RootState) =>
  state.settings.activeNetwork;

export const selectApiConfigBasedOnActiveNetwork = createSelector(
  selectActiveNetworkSetting,
  activeNetwork => {
    switch (activeNetwork) {
      case NetworkSetting.Mainnet:
        return {
          casperLiveUrl: CasperLiveUrl.MainnetUrl,
          networkName: NetworkName.Mainnet,
          nodeUrl: CasperNodeUrl.MainnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Mainnet,
          csprMarketContractHash: CSPRMarketContractHash.Mainnet,
          associatedKeysContractHash: AssociatedKeysContractHash.Mainnet,
          csprStudioCep47ContractHash: CSPRStudioCep47ContractHash.Mainnet,
          auctionPoolContractHash: AuctionPoolContractHash.Mainnet
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          networkName: NetworkName.Testnet,
          nodeUrl: CasperNodeUrl.TestnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Testnet,
          csprMarketContractHash: CSPRMarketContractHash.Testnet,
          associatedKeysContractHash: AssociatedKeysContractHash.Testnet,
          csprStudioCep47ContractHash: CSPRStudioCep47ContractHash.Testnet,
          auctionPoolContractHash: AuctionPoolContractHash.Testnet
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);

export const selectThemeModeSetting = (state: RootState) =>
  state.settings.themeMode;
