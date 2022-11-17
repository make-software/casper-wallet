import { createAction } from 'typesafe-actions';
import { PopupState } from '@background/background-events';

export const E2ESetToPopupState = createAction(
  'E2E_SET_TO_POPUP_STATE'
)<PopupState>();
