import { RootState } from '@background/redux/store-types';

export const selectLedgerNewWindowId = (state: RootState): number | null =>
  state.ledger.windowId;

export const selectLedgerOpenerWindowId = (state: RootState): number | null =>
  state.ledger.openerWindowId;

export const selectLedgerDeploy = (state: RootState): string | null =>
  state.ledger.deploy;

export const selectLedgerTransaction = (state: RootState): string | null =>
  state.ledger.transaction;

export const selectLedgerRecipientToSaveOnSuccess = (
  state: RootState
): string | null => state.ledger.recipientToSaveOnSuccess;
