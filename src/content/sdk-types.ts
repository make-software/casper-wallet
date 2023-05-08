/**
 * Each event will contain a `json string` payload in the `event.detail` property. This payload contains the Casper Wallet internal state so you can keep you application UI in sync.
 */
export type CasperWalletState = {
  /** contain wallet is locked flag */
  isLocked: boolean;
  /** if unlocked contain connected status flag of active key otherwise undefined */
  isConnected: boolean | undefined;
  /** if unlocked and connected contain active key otherwise undefined */
  activeKey: string | undefined;
};
