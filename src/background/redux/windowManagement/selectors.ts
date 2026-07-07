import { RootState } from '@background/redux/store-types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;
