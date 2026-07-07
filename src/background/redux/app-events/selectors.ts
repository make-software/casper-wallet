import { RootState } from '@background/redux/store-types';

export const selectDismissedAppEvents = (state: RootState) =>
  state.appEvents.dismissedEventIds;
