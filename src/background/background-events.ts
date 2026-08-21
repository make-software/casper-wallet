import { createAction } from '@reduxjs/toolkit';

import { PopupState } from './redux/popup-state';

// General purpose events emitted by background to all extension windows

export const backgroundEvent = {
  popupStateUpdated: createAction<PopupState>('popupStateUpdated')
};

export type BackgroundEvent = ReturnType<
  (typeof backgroundEvent)[keyof typeof backgroundEvent]
>;
