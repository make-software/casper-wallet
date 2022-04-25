import { createSelector } from '@reduxjs/toolkit';

import { State } from '@src/redux/types';
import { formIsValid } from '@src/pages/create-vault/validation';

export const selectPassword = (state: State) => state.createVaultPage.password;
export const selectConfirmPassword = (state: State) =>
  state.createVaultPage.confirmPassword;
export const selectFormErrors = (state: State) => state.createVaultPage.errors;

export const selectFormIsValid = createSelector(
  selectPassword,
  selectConfirmPassword,
  (password, confirmPassword) => formIsValid(password, confirmPassword)
);
