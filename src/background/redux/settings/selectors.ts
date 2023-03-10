import { RootState } from 'typesafe-actions';
import { createSelector } from 'reselect';

import { Network } from '@background/redux/settings/types';
import { CasperApiUrl, CasperLiveUrl } from '@src/constants';

export const selectTimeoutDurationSetting = (state: RootState) =>
  state.settings.activeTimeoutDuration;

export const selectActiveNetworkSetting = (state: RootState) =>
  state.settings.activeNetwork;

export const selectCasperUrlsBaseOnActiveNetworkSetting = createSelector(
  selectActiveNetworkSetting,
  activeNetwork => {
    if (activeNetwork === Network.Mainnet) {
      return {
        casperLiveUrl: CasperLiveUrl.MainnetUrl,
        casperApiUrl: CasperApiUrl.MainnetUrl
      };
    } else {
      return {
        casperLiveUrl: CasperLiveUrl.TestnetUrl,
        casperApiUrl: CasperApiUrl.TestnetUrl
      };
    }
  }
);
