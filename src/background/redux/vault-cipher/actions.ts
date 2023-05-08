import { createAction } from 'typesafe-actions';

export const vaultCipherReseted = createAction('VAULT_CIPHER_RESETED')<void>();

export const vaultCipherCreated = createAction('VAULT_CIPHER_CREATED')<{
  vaultCipher: string;
}>();
