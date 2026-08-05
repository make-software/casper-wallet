import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AppEventsState, SagaError } from './types';

const initialState: AppEventsState = {
  dismissedEventIds: [],
  errors: [],
  nextErrorId: 0
};

const slice = createSlice({
  name: 'appEvents',
  initialState,
  reducers: {
    dismissAppEvent: (state, action: PayloadAction<number>) => ({
      ...state,
      dismissedEventIds: [
        ...new Set([...state.dismissedEventIds, action.payload])
      ]
    }),
    resetAppEventsDismission: () => initialState,
    sagaError: (
      state,
      action: PayloadAction<{
        source: string;
        message: string;
        code?: string;
      }>
    ) => {
      const entry: SagaError = {
        id: state.nextErrorId,
        source: action.payload.source,
        message: action.payload.message,
        ...(action.payload.code !== undefined
          ? { code: action.payload.code }
          : {})
      };
      return {
        ...state,
        errors: [...state.errors, entry].slice(-10),
        nextErrorId: state.nextErrorId + 1
      };
    },
    dismissSagaError: (state, action: PayloadAction<number>) => ({
      ...state,
      errors: state.errors.filter(error => error.id !== action.payload)
    }),
    /**
     * Retracts every error a single producer has on screen. `errors` is
     * otherwise append-only, so a producer that can be retriggered by the user
     * leaves its previous failures pinned — including on top of the very screen
     * a successful retry opens. A producer dispatches this before re-attempting
     * so what the banner shows is always the current attempt.
     */
    dismissSagaErrorsBySource: (state, action: PayloadAction<string>) => ({
      ...state,
      errors: state.errors.filter(error => error.source !== action.payload)
    })
  }
});

export const {
  dismissAppEvent,
  resetAppEventsDismission,
  sagaError,
  dismissSagaError,
  dismissSagaErrorsBySource
} = slice.actions;
export const reducer = slice.reducer;
