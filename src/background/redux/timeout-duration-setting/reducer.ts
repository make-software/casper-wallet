import { TimeoutDurationSetting } from '@src/apps/popup/constants';
import { createReducer } from 'typesafe-actions';
import { timeoutDurationSettingChanged } from './actions';

export type TimeoutDurationSettingState = TimeoutDurationSetting;

const initialState = TimeoutDurationSetting['5 min'];

export const reducer = createReducer(initialState).handleAction(
  timeoutDurationSettingChanged,
  (state, action): TimeoutDurationSettingState => action.payload
);
