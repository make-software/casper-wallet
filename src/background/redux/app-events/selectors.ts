import { RootState } from '@background/redux/store-types';

export const selectDismissedAppEvents = (state: RootState) =>
  state.appEvents.dismissedEventIds;

export const selectSagaErrors = (state: RootState) => state.appEvents.errors;
