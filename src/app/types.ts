export type Timeout = '1min' | '5min' | '15min' | '30min' | '1hour' | '24hours';
export enum TimeoutValue {
  '1min' = 1000 * 60,
  '5min' = 1000 * 60 * 5,
  '15min' = 1000 * 60 * 15,
  '30min' = 1000 * 60 * 30,
  '1hour' = 1000 * 60 * 60,
  '24hours' = 1000 * 60 * 60 * 24
}
