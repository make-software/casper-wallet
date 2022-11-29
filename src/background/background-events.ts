import { VaultState } from '@src/background/redux/vault/types';
import { WindowManagementState } from '@src/background/redux/windowManagement/types';
import { ActionType, createAction, RootState } from 'typesafe-actions';
import { DeploysState } from './redux/deploys/types';
import { KeysState } from './redux/keys/types';
import { SessionState } from './redux/session/types';

// General purpose events emitted by background to all extension windows

export type PopupState = {
  keys: KeysState;
  session: SessionState;
  vault: VaultState;
  deploys: DeploysState;
  windowManagement: WindowManagementState;
};

export const selectPopupState = (state: RootState): PopupState => {
  // TODO: must sanitize state to not send private data back to front
  return {
    keys: state.keys,
    session: state.session,
    vault: state.vault,
    deploys: state.deploys,
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
