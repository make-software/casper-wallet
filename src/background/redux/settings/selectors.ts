import { RootState } from 'typesafe-actions';
import { createSelector } from 'reselect';

import { CasperApiUrl, CasperLiveUrl, NetworkSetting } from '@src/constants';

export const selectTimeoutDurationSetting = (state: RootState) =>
  state.settings.activeTimeoutDuration;

export const selectActiveNetworkSetting = (state: RootState) =>
  state.settings.activeNetwork;

export const selectCasperUrlsBaseOnActiveNetworkSetting = createSelector(
  selectActiveNetworkSetting,
  activeNetwork => {
    switch (activeNetwork) {
      case NetworkSetting.Mainnet:
        return {
          casperLiveUrl: CasperLiveUrl.MainnetUrl,
          casperApiUrl: CasperApiUrl.MainnetUrl
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          casperApiUrl: CasperApiUrl.TestnetUrl
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);
