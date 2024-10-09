import { createAction } from 'typesafe-actions';

export const ratedInStoreChanged = createAction(
  'RATED_IN_STORE_CHANGED'
)<boolean>();

export const askForReviewAfterChanged = createAction(
  'ASK_FOR_REVIEW_AFTER_CHANGED'
)<number>();

export const resetRateApp = createAction('RESET_RATE_APP')();
