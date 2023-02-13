const EVENT_TYPE_PREFIX = 'casper-wallet';

/**
 * Event types emitted by the Casper Wallet extension.
 */
export const CasperWalletEventType = {
  /** Account was connected using the wallet: */
  Connected: `${EVENT_TYPE_PREFIX}:connected`,
  /** Account was disconnected using the wallet: */
  Disconnected: `${EVENT_TYPE_PREFIX}:disconnected`,
  /** Browser tab was changed to some connected site: */
  TabChanged: `${EVENT_TYPE_PREFIX}:tabChanged`,
  /** Active key was changed using the Wallet interface: */
  ActiveKeyChanged: `${EVENT_TYPE_PREFIX}:activeKeyChanged`,
  /** Wallet was locked: */
  Locked: `${EVENT_TYPE_PREFIX}:locked`,
  /** Wallet was unlocked: */
  Unlocked: `${EVENT_TYPE_PREFIX}:unlocked`
} as const;
