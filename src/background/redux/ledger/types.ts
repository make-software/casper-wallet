export interface LedgerState {
  windowId: number | null;
  /** The window the flow that opened `windowId` was rendering in. */
  openerWindowId: number | null;
  /**
   * The dapp request that flow was serving, or `null` for the internal flows.
   * Qualifies `openerWindowId`: approval windows are one reused browser slot.
   */
  openerRequestId: string | null;
  deploy: string | null;
  transaction: string | null;
  recipientToSaveOnSuccess: string | null;
  /** A composed swap or wrap awaiting a device signature, as JSON — see `parseLedgerSwapPayload`. */
  swapPayload: string | null;
}
