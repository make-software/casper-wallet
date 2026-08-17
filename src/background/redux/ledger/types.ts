export interface LedgerState {
  windowId: number | null;
  /** The window the flow that opened `windowId` was rendering in. */
  openerWindowId: number | null;
  /**
   * The dapp request that flow was serving, or `null` for the internal flows.
   * Qualifies `openerWindowId`, which is a browser window and therefore outlives
   * the document that recorded it — approval windows are one reused slot.
   */
  openerRequestId: string | null;
  deploy: string | null;
  transaction: string | null;
  recipientToSaveOnSuccess: string | null;
}
