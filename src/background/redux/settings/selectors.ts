import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import {
  AuctionManagerContractHash,
  CasperClarityApiUrl,
  CasperLiveUrl,
  CasperNodeStatusUrl,
  CasperNodeUrl,
  CasperWalletApiUrl,
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
          casperClarityApiUrl: CasperClarityApiUrl.MainnetUrl,
          casperWalletApiUrl: CasperWalletApiUrl.MainnetUrl,
          networkName: NetworkName.Mainnet,
          nodeUrl: CasperNodeUrl.MainnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Mainnet,
          nodeStatusUrl: CasperNodeStatusUrl.MainnetUrl
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          casperClarityApiUrl: CasperClarityApiUrl.TestnetUrl,
          casperWalletApiUrl: CasperWalletApiUrl.TestnetUrl,
          networkName: NetworkName.Testnet,
          nodeUrl: CasperNodeUrl.TestnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Testnet,
          nodeStatusUrl: CasperNodeStatusUrl.TestnetUrl
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);

export const selectThemeModeSetting = (state: RootState) =>
  state.settings.themeMode;
