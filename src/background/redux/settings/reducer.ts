import { createReducer } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import { NetworkSetting } from '@src/constants';

import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} from './actions';
import { SettingsState, ThemeMode } from './types';

const initialState: SettingsState = {
  activeNetwork: NetworkSetting.Mainnet,
  activeTimeoutDuration: TimeoutDurationSetting['5 min'],
  isDarkMode: false,
  themeMode: ThemeMode.SYSTEM
};

export const reducer = createReducer(initialState)
  .handleAction(vaultSettingsReseted, (): SettingsState => initialState)
  .handleAction(
    activeTimeoutDurationSettingChanged,
    (state, { payload }): SettingsState => ({
      ...state,
      activeTimeoutDuration: payload
    })
  )
  .handleAction(
    activeNetworkSettingChanged,
    (state, { payload }): SettingsState => ({
      ...state,
      activeNetwork: payload
    })
  )
  .handleAction(
    themeModeSettingChanged,
    (state, { payload }): SettingsState => ({
      ...state,
      themeMode: payload
    })
  );
