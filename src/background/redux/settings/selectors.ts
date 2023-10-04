import { RootState } from 'typesafe-actions';
import { createSelector } from 'reselect';

import {
  CasperApiUrl,
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
          casperApiUrl: CasperApiUrl.MainnetUrl,
          networkName: NetworkName.Mainnet,
          nodeUrl: CasperNodeUrl.MainnetUrl
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          casperApiUrl: CasperApiUrl.TestnetUrl,
          networkName: NetworkName.Testnet,
          nodeUrl: CasperNodeUrl.TestnetUrl
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);

export const selectDarkModeSetting = (state: RootState) =>
  state.settings.isDarkMode;
