const EVENT_TYPE_PREFIX = 'casper-wallet';

export const SdkEventTypes = {
  Connected: `${EVENT_TYPE_PREFIX}:connected`,
  Disconnected: `${EVENT_TYPE_PREFIX}:disconnected`,
  TabChanged: `${EVENT_TYPE_PREFIX}:tabChanged`,
  ActiveKeyChanged: `${EVENT_TYPE_PREFIX}:activeKeyChanged`
} as const;
