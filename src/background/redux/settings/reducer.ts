import { createReducer } from 'typesafe-actions';

import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged
} from './actions';
import { Network, SettingsState, TimeoutDurationSetting } from './types';

const initialState: SettingsState = {
  activeNetwork: Network.Mainnet,
  activeTimeoutDuration: TimeoutDurationSetting['5 min']
};

export const reducer = createReducer(initialState)
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
  );
