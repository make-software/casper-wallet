export interface LedgerState {
  windowId: number | null;
  deploy: string | null;
  transaction: string | null;
  recipientToSaveOnSuccess: string | null;
}
