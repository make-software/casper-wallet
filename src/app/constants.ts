export enum TimeoutDurationSetting {
  '1 min' = '1 min',
  '5 min' = '5 min',
  '15 min' = '15 min',
  '30 min' = '30 min',
  '1 hour' = '1 hour',
  '24 hours' = '24 hours'
}

export const MapTimeoutDurationSettingToValue = {
  [TimeoutDurationSetting['1 min']]: 1000 * 60 * 1,
  [TimeoutDurationSetting['5 min']]: 1000 * 60 * 5,
  [TimeoutDurationSetting['15 min']]: 1000 * 60 * 15,
  [TimeoutDurationSetting['30 min']]: 1000 * 60 * 30,
  [TimeoutDurationSetting['1 hour']]: 1000 * 60 * 60,
  [TimeoutDurationSetting['24 hours']]: 1000 * 60 * 60 * 24
};
