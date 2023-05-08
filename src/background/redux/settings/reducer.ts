import { createReducer } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import { NetworkSetting } from '@src/constants';

import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged
} from './actions';
import { SettingsState } from './types';

const initialState: SettingsState = {
  activeNetwork: NetworkSetting.Mainnet,
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
