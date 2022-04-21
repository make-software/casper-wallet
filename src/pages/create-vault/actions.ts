import { createAction } from 'typesafe-actions';

export interface CreateVaultAction {
  password: string;
}

export const changePassword = createAction(
  'CREATE_VAULT/CHANGE_PASSWORD_VALUE'
)<CreateVaultAction>();

export const changeConfirmPassword = createAction(
  'CREATE_VAULT/CHANGE_CONFIRM_PASSWORD_VALUE'
)<CreateVaultAction>();

export const enableButton = createAction('CREATE_VAULT/ENABLE_BUTTON')<void>();

export const disableButton = createAction(
  'CREATE_VAULT/DISABLE_BUTTON'
)<void>();
