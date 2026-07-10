import { createAction } from '@reduxjs/toolkit';

import { PopupState } from './redux/types';

// General purpose events emitted by background to all extension windows

export const backgroundEvent = {
  popupStateUpdated: createAction<PopupState>('popupStateUpdated')
};

export type BackgroundEvent = ReturnType<
  (typeof backgroundEvent)[keyof typeof backgroundEvent]
>;

export function isBackgroundEvent(action?: {
  type?: unknown;
  meta?: unknown;
}): action is BackgroundEvent {
  return typeof action?.type === 'string' && action.meta === undefined;
}
