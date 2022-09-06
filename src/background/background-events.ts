import { VaultState } from '@src/background/redux/vault/types';
import { WindowManagementState } from '@src/background/redux/windowManagement/types';
import { ActionType, createAction, RootState } from 'typesafe-actions';

// General purpose events emitted by background to all extension windows

export type PopupState = {
  vault: VaultState;
  windowManagement: WindowManagementState;
};

export const selectPopupState = (state: RootState): PopupState => {
  // TODO: must sanitize state to not send private data back to front
  return {
    vault: state.vault,
    windowManagement: state.windowManagement
  };
};

export const backgroundEvent = {
  popupStateUpdated: createAction('popupStateUpdated')<PopupState>()
};

export type BackgroundEvent = ActionType<typeof backgroundEvent>;

export function isBackgroundEvent(action?: {
  type?: unknown;
  meta?: unknown;
}): action is BackgroundEvent {
  return typeof action?.type === 'string' && action.meta === undefined;
}
