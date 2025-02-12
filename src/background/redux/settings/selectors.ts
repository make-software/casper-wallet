import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import {
  AssociatedKeysContractHash,
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
          csprMarketContractHash: CSPRMarketContractHash.Mainnet,
          associatedKeysContractHash: AssociatedKeysContractHash.Mainnet,
          csprStudioCep47ContractHash: CSPRStudioCep47ContractHash.Mainnet,
          auctionPoolContractHash: AuctionPoolContractHash.Mainnet
        };
      case NetworkSetting.Devnet:
        return {
          casperLiveUrl: CasperLiveUrl.Devnet,
          networkName: NetworkName.Devnet,
          nodeUrl: CasperNodeUrl.DevnetUrl,
          csprMarketContractHash: CSPRMarketContractHash.Testnet,
          associatedKeysContractHash: AssociatedKeysContractHash.Testnet,
          csprStudioCep47ContractHash: CSPRStudioCep47ContractHash.Testnet,
          auctionPoolContractHash: AuctionPoolContractHash.Testnet
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          networkName: NetworkName.Testnet,
          nodeUrl: CasperNodeUrl.TestnetUrl,
          csprMarketContractHash: CSPRMarketContractHash.Testnet,
          associatedKeysContractHash: AssociatedKeysContractHash.Testnet,
          csprStudioCep47ContractHash: CSPRStudioCep47ContractHash.Testnet,
          auctionPoolContractHash: AuctionPoolContractHash.Testnet
        };
      case NetworkSetting.Integration:
        return {
          casperLiveUrl: CasperLiveUrl.Integration,
          networkName: NetworkName.Integration,
          nodeUrl: CasperNodeUrl.Integration,
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

export const selectCasperNetworkApiVersion = (state: RootState) =>
  state.settings.casperNetworkApiVersion;

export const selectIsCasper2Network = (state: RootState) =>
  state.settings.casperNetworkApiVersion?.startsWith('2.') ?? false;
