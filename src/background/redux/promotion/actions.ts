import { createAction } from 'typesafe-actions';

export const setShowCSPRNamePromotion = createAction(
  'SET_SHOW_CSPR_NAME_PROMOTION'
)<boolean>();

export const resetPromotion = createAction('RESET_PROMOTION')();
