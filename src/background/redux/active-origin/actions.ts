import { createAction } from 'typesafe-actions';

export const activeOriginChanged = createAction('ACTIVE_ORIGIN_CHANGED')<
  string | null
>();
