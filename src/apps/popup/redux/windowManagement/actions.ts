import { createAction } from 'typesafe-actions';

export const windowIdChanged = createAction('WINDOW_ID_CHANGED')<number>();
export const windowIdCleared = createAction('WINDOW_ID_CLEARED')<void>();
export const popupWindowInit = createAction('POPUP_WINDOW_INIT')<void>();
export const connectWindowInit = createAction('CONNECT_WINDOW_INIT')<void>();
export const importWindowInit = createAction('IMPORT_WINDOW_INIT')<void>();
