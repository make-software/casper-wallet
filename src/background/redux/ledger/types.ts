export interface LedgerState {
  windowId: number | null;
  /** The window the flow that opened `windowId` was rendering in. */
  openerWindowId: number | null;
  deploy: string | null;
  transaction: string | null;
  recipientToSaveOnSuccess: string | null;
}
