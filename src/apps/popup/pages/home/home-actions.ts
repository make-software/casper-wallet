export type HomeAction = 'buy' | 'send' | 'swap' | 'delegate' | 'receive';

const HOME_ACTION_PRIORITY: HomeAction[] = [
  'buy',
  'send',
  'swap',
  'delegate',
  'receive'
];

/** The home row always shows this many actions before More, taken in priority order. */
const HOME_PRIMARY_ACTION_SLOTS = 3;

export const selectHomeActions = (
  available: Record<HomeAction, boolean>
): HomeAction[] =>
  HOME_ACTION_PRIORITY.filter(action => available[action]).slice(
    0,
    HOME_PRIMARY_ACTION_SLOTS
  );
