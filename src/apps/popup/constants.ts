export enum TimeoutDurationSetting {
  '1 min' = '1 min',
  '5 min' = '5 min',
  '15 min' = '15 min',
  '30 min' = '30 min',
  '1 hour' = '1 hour',
  '24 hours' = '24 hours'
}

export const MapTimeoutDurationSettingToValue = {
  [TimeoutDurationSetting['1 min']]: 1,
  [TimeoutDurationSetting['5 min']]: 5,
  [TimeoutDurationSetting['15 min']]: 15,
  [TimeoutDurationSetting['30 min']]: 30,
  [TimeoutDurationSetting['1 hour']]: 60,
  [TimeoutDurationSetting['24 hours']]: 60 * 24
};

export const LOCK_VAULT_TIMEOUT = 1000 * 60 * 5;
