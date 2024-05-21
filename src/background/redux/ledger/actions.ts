import { createAction } from 'typesafe-actions';

export const ledgerNewWindowIdChanged = createAction(
  'LEDGER_NEW_WINDOW_ID_CHANGED'
)<number>();
export const ledgerDeployChanged = createAction(
  'LEDGER_DEPLOY_CHANGED'
)<string>();
export const ledgerRecipientToSaveOnSuccessChanged = createAction(
  'LEDGER_RECIPIENT_TO_SAVE_ON_SUCCESS_CHANGED'
)<string>();
export const ledgerStateCleared = createAction('LEDGER_STATE_CLEARED')<void>();
