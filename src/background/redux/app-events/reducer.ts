import { createReducer } from 'typesafe-actions';

import {
  dismissAppEvent,
  resetAppEventsDismission
} from '@background/redux/app-events/actions';

import { AppEventsState } from './types';

const initialState: AppEventsState = {
  dismissedEventIds: []
};

export const reducer = createReducer(initialState)
  .handleAction(
    dismissAppEvent,
    (state: AppEventsState, action: ReturnType<typeof dismissAppEvent>) => ({
      ...state,
      dismissedEventIds: [
        ...new Set([...state.dismissedEventIds, action.payload])
      ]
    })
  )
  .handleAction(resetAppEventsDismission, () => initialState);
