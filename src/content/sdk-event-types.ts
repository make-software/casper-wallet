const EVENT_TYPE_PREFIX = 'casper-wallet';

export const SdkEventTypes = {
  Connected: `${EVENT_TYPE_PREFIX}:connected`,
  Disconnected: `${EVENT_TYPE_PREFIX}:disconnected`,
  ActiveKeyChanged: `${EVENT_TYPE_PREFIX}:activeKeyChanged`
} as const;
