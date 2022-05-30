import { createAction } from 'typesafe-actions';

export const saveWindowId = createAction('STORE_WINDOW_ID')<number>();
export const clearWindowId = createAction('CLEAR_WINDOW_ID')<void>();
