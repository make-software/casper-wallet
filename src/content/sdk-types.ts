/**
 * Each event will contain a `json string` payload in the `event.detail` property. This payload contains the Casper Wallet internal state so you can keep you application UI in sync.
 */
export type CasperWalletState = {
  /** contain wallet is locked flag */
  isLocked: boolean;
  /** contain active key is connected flag */
  isConnected: boolean;
  /** if unlocked and connected contain active key otherwise null */
  activeKey: string | null;
};
