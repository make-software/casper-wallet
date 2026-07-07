import { RootState } from '@background/redux/store-types';

export const selectRatedInStore = (state: RootState) =>
  state.rateApp.ratedInStore;

export const selectAskForReviewAfter = (state: RootState) =>
  state.rateApp.askForReviewAfter;
