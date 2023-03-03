import { createReducer } from 'typesafe-actions';
import { vaultUnlocked } from '../session/actions';
import { lastActivityTimeRefreshed } from './actions';

export type LastActivityTimeState = number | null;

const initialState = null as LastActivityTimeState;

export const reducer = createReducer(initialState).handleAction(
  [lastActivityTimeRefreshed, vaultUnlocked],
  (state, { payload: { lastActivityTime } }) => lastActivityTime
);
