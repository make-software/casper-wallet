import { ActionType, createAction } from 'typesafe-actions';

import { PopupState } from './redux/types';

// General purpose events emitted by background to all extension windows

export const backgroundEvent = {
  popupStateUpdated: createAction('popupStateUpdated')<PopupState>()
};

export type BackgroundEvent = ActionType<typeof backgroundEvent>;
export type popupStateUpdated = ActionType<
  typeof backgroundEvent.popupStateUpdated
>;

export function isBackgroundEvent(action?: {
  type?: unknown;
  meta?: unknown;
}): action is BackgroundEvent {
  return typeof action?.type === 'string' && action.meta === undefined;
}
