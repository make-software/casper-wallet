import { createAction } from 'typesafe-actions';

export const activeOriginFaviconChanged = createAction(
  'ACTIVE_ORIGIN_FAVICON_CHANGED'
)<string | null>();
