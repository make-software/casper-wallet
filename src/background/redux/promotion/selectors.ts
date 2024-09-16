import { RootState } from 'typesafe-actions';

export const selectShowCSPRNamePromotion = (state: RootState) =>
  state.promotion.showCSPRNamePromotion;
