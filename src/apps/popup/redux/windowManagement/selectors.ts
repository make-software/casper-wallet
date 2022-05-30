import { State } from '@popup/redux/types';

export const selectWindowId = (state: State): number | null =>
  state.windowManagement.windowId;
