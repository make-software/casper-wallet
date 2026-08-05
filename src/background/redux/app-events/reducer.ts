import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AppEventsState, SagaError, SagaErrorSource } from './types';

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
        source: SagaErrorSource;
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
    })
  }
});

export const {
  dismissAppEvent,
  resetAppEventsDismission,
  sagaError,
  dismissSagaError
} = slice.actions;
export const reducer = slice.reducer;
