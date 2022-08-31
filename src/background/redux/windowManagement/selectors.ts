import { RootState } from 'typesafe-actions';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;
