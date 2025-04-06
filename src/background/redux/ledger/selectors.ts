import { RootState } from 'typesafe-actions';

export const selectLedgerNewWindowId = (state: RootState): number | null =>
  state.ledger.windowId;

export const selectLedgerDeploy = (state: RootState): string | null =>
  state.ledger.deploy;

export const selectLedgerTransaction = (state: RootState): string | null =>
  state.ledger.transaction;

export const selectLedgerRecipientToSaveOnSuccess = (
  state: RootState
): string | null => state.ledger.recipientToSaveOnSuccess;
