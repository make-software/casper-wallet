import { createReducer, Action } from 'typesafe-actions';

import { CreateVaultState } from './types';
import {
  changePassword,
  changeConfirmPassword,
  setFormErrors
} from './actions';

const initialState: CreateVaultState = {
  password: null,
  confirmPassword: null,
  errors: {
    passwordErrorMessage: null,
    confirmPasswordErrorMessage: null
  }
};

export const reducer = createReducer<CreateVaultState, Action>(initialState)
  .handleAction([changePassword], (state, { payload }) => ({
    ...state,
    password: payload
  }))
  .handleAction([changeConfirmPassword], (state, { payload }) => ({
    ...state,
    confirmPassword: payload
  }))
  .handleAction([setFormErrors], (state, { payload }) => ({
    ...state,
    errors: {
      ...state.errors,
      ...payload
    }
  }));
