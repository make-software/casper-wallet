import { createAction } from 'typesafe-actions';

export const dismissAppEvent = createAction('DISMISS_APP_EVENT')<number>();

export const resetAppEventsDismission = createAction(
  'RESET_APP_EVENTS_DISMISSION'
)();
