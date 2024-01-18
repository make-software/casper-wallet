import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import {
  AuctionManagerContractHash,
  CasperClarityApiUrl,
  CasperCloudApiUrl,
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
          casperClarityApiUrl: CasperClarityApiUrl.MainnetUrl,
          casperCloudApiUrl: CasperCloudApiUrl.MainnetUrl,
          networkName: NetworkName.Mainnet,
          nodeUrl: CasperNodeUrl.MainnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Mainnet
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          casperClarityApiUrl: CasperClarityApiUrl.TestnetUrl,
          casperCloudApiUrl: CasperCloudApiUrl.TestnetUrl,
          networkName: NetworkName.Testnet,
          nodeUrl: CasperNodeUrl.TestnetUrl,
          auctionManagerContractHash: AuctionManagerContractHash.Testnet
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);

export const selectThemeModeSetting = (state: RootState) =>
  state.settings.themeMode;
