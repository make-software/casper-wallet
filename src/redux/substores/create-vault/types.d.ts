export interface CreateVaultFormErrors {
  passwordErrorMessage?: string | null;
  confirmPasswordErrorMessage?: string | null;
}

export interface CreateVaultState {
  password: string | null;
  confirmPassword: string | null;
  errors: CreateVaultFormErrors;
}
