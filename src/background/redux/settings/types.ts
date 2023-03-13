export enum Network {
  'Mainnet' = 'Mainnet',
  'Testnet' = 'Testnet'
}

export enum TimeoutDurationSetting {
  '1 min' = '1 min',
  '5 min' = '5 min',
  '15 min' = '15 min',
  '30 min' = '30 min',
  '1 hour' = '1 hour',
  '24 hours' = '24 hours'
}

export interface SettingsState {
  activeTimeoutDuration: TimeoutDurationSetting;
  activeNetwork: Network;
}
