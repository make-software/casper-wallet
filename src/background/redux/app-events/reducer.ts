import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AppEventsState, SagaError } from './types';

const initialState: AppEventsState = {
  dismissedEventIds: [],
  errors: []
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
      const nextId = state.errors.length
        ? Math.max(...state.errors.map(error => error.id)) + 1
        : 0;
      const entry: SagaError = {
        id: nextId,
        source: action.payload.source,
        message: action.payload.message,
        ...(action.payload.code !== undefined
          ? { code: action.payload.code }
          : {})
      };
      return {
        ...state,
        errors: [...state.errors, entry].slice(-10)
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
