export enum Timeout {
  '1 min' = '1 min',
  '5 min' = '5 min',
  '15 min' = '15 min',
  '30 min' = '30 min',
  '1 hour' = '1 hour',
  '24 hours' = '24 hours'
}

export const TimeoutValue = {
  [Timeout['1 min']]: 1000 * 60,
  [Timeout['5 min']]: 1000 * 60 * 5,
  [Timeout['15 min']]: 1000 * 60 * 15,
  [Timeout['30 min']]: 1000 * 60 * 30,
  [Timeout['1 hour']]: 1000 * 60 * 60,
  [Timeout['24 hours']]: 1000 * 60 * 60 * 24
};
