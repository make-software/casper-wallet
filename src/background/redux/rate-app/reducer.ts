import { createReducer } from 'typesafe-actions';

import {
  askForReviewAfterChanged,
  ratedInStoreChanged,
  resetRateApp
} from '@background/redux/rate-app/actions';
import { RateAppState } from '@background/redux/rate-app/types';

// Define the initial State for the Rate App
const initialState: RateAppState = {
  ratedInStore: false,
  askForReviewAfter: null
};

/**
 * Reducer for handling changes related to Reviews
 *
 * @name reducer
 * @function
 * @returns {RateAppState} - The updated state
 */
export const reducer = createReducer(initialState)
  // Handling action when InStore rating changes
  .handleAction(
    ratedInStoreChanged,
    (state: RateAppState, action: ReturnType<typeof ratedInStoreChanged>) => ({
      ...state,
      ratedInStore: action.payload
    })
  )
  // Handles the action triggered when the time period, after which a rate app request should be made, is updated.
  .handleAction(
    askForReviewAfterChanged,
    (state, action: ReturnType<typeof askForReviewAfterChanged>) => ({
      ...state,
      askForReviewAfter: action.payload
    })
  )
  .handleAction(resetRateApp, () => initialState);
