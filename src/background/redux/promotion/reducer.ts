import { createReducer } from 'typesafe-actions';

import {
  resetPromotion,
  setShowCSPRNamePromotion
} from '@background/redux/promotion/actions';
import { PromotionState } from '@background/redux/promotion/types';

const initialState: PromotionState = {
  showCSPRNamePromotion: true
};

export const reducer = createReducer(initialState)
  .handleAction(
    setShowCSPRNamePromotion,
    (
      state: PromotionState,
      action: ReturnType<typeof setShowCSPRNamePromotion>
    ) => ({
      ...state,
      showCSPRNamePromotion: action.payload
    })
  )
  .handleAction(resetPromotion, () => initialState);
