import { RootState } from 'typesafe-actions';

export const selectDismissedAppEvents = (state: RootState) =>
  state.appEvents.dismissedEventIds;
