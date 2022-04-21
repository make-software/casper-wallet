import { State } from '@src/redux/types';

export const selectPassword = (state: State) => state.createVaultPage?.password;
export const selectConfirmPassword = (state: State) =>
  state.createVaultPage?.confirmPassword;
export const selectButtonIsEnabled = (state: State) =>
  state.createVaultPage?.buttonIsEnabled;
