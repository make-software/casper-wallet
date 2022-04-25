import { createAction } from 'typesafe-actions';
import { CreateVaultFormErrors } from './types';

const PAGE = 'CREATE_VAULT';

export const changePassword = createAction(`${PAGE}/CHANGE_PASSWORD_VALUE`)<
  string | null
>();

export const changeConfirmPassword = createAction(
  `${PAGE}/CHANGE_CONFIRM_PASSWORD_VALUE`
)<string | null>();

export const setFormErrors = createAction(
  `${PAGE}/SET_FORM_ERRORS`
)<CreateVaultFormErrors>();
