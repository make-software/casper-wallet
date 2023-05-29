import { RootState } from 'typesafe-actions';
import { createSelector } from 'reselect';

import {
  CasperApiUrl,
  CasperLiveUrl,
  GrpcUrl,
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
          grpcUrl: GrpcUrl.MainnetUrl,
          networkName: NetworkName.Mainnet
        };
      case NetworkSetting.Testnet:
        return {
          casperLiveUrl: CasperLiveUrl.TestnetUrl,
          casperApiUrl: CasperApiUrl.TestnetUrl,
          grpcUrl: GrpcUrl.TestNetUrl,
          networkName: NetworkName.Testnet
        };
      default:
        throw new Error(`Unknown network: ${activeNetwork}`);
    }
  }
);
