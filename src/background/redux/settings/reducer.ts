import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  DEFAULT_DEADLINE,
  DEFAULT_SLIPPAGE
} from 'casper-wallet-core/src/domain/constants/config';
import {
  clampDeadlineValue,
  clampSlippageValue
} from 'casper-wallet-core/src/utils/swap';

import { NetworkSetting } from '@src/constants';
import { isSafariBuild } from '@src/utils';

import { TimeoutDurationSetting } from '@popup/constants';

import { SettingsState, ThemeMode } from './types';

const initialState: SettingsState = {
  activeNetwork: NetworkSetting.Mainnet,
  casperNetworkApiVersion: '1.5.8',
  activeTimeoutDuration: TimeoutDurationSetting['5 min'],
  isDarkMode: false, // Deprecated
  themeMode: isSafariBuild ? ThemeMode.LIGHT : ThemeMode.SYSTEM,
  systemColorScheme: null,
  swapSlippage: DEFAULT_SLIPPAGE,
  swapDeadline: DEFAULT_DEADLINE
};

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    vaultSettingsReseted: () => initialState,
    activeTimeoutDurationSettingChanged: (
      state,
      { payload }: PayloadAction<TimeoutDurationSetting>
    ) => ({ ...state, activeTimeoutDuration: payload }),
    activeNetworkSettingChanged: (
      state,
      { payload }: PayloadAction<NetworkSetting>
    ) => ({ ...state, activeNetwork: payload }),
    themeModeSettingChanged: (
      state,
      { payload }: PayloadAction<ThemeMode>
    ) => ({ ...state, themeMode: payload }),
    casperNetworkApiVersionChanged: (
      state,
      { payload }: PayloadAction<string>
    ) => ({ ...state, casperNetworkApiVersion: payload }),
    systemColorSchemeChanged: (
      state,
      { payload }: PayloadAction<'dark' | 'light'>
    ) => ({ ...state, systemColorScheme: payload }),
    swapSlippageSettingChanged: (
      state,
      { payload }: PayloadAction<number>
    ) => ({ ...state, swapSlippage: clampSlippageValue(payload) }),
    swapDeadlineSettingChanged: (
      state,
      { payload }: PayloadAction<number>
    ) => ({ ...state, swapDeadline: clampDeadlineValue(payload) })
  }
});

export const {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  casperNetworkApiVersionChanged,
  swapDeadlineSettingChanged,
  swapSlippageSettingChanged,
  systemColorSchemeChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} = slice.actions;
export const reducer = slice.reducer;
