import { RootState } from 'typesafe-actions';

export const selectRatedInStore = (state: RootState) =>
  state.rateApp.ratedInStore;

export const selectAskForReviewAfter = (state: RootState) =>
  state.rateApp.askForReviewAfter;
