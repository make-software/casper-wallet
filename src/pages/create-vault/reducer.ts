import { createReducer, Action } from 'typesafe-actions';

import { CreateVaultState } from './types';
import {
  changePassword,
  changeConfirmPassword,
  enableButton,
  disableButton
} from './actions';

const initialState: CreateVaultState = {
  password: '',
  confirmPassword: '',
  buttonIsEnabled: false
};

export const reducer = createReducer<CreateVaultState, Action>(initialState)
  .handleAction([changePassword], (state, { payload: { password } }) => ({
    ...state,
    password
  }))
  .handleAction(
    [changeConfirmPassword],
    (state, { payload: { password } }) => ({
      ...state,
      confirmPassword: password
    })
  )
  .handleAction([enableButton], state => ({
    ...state,
    buttonIsEnabled: true
  }))
  .handleAction([disableButton], state => ({
    ...state,
    buttonIsEnabled: false
  }));
