import { createAction } from 'typesafe-actions';

export const lastActivityTimeRefreshed = createAction(
  'LAST_ACTIVITY_TIME_REFRESHED',
  () => ({
    lastActivityTime: Date.now()
  })
)<{
  lastActivityTime: number;
}>();
