import { createAction } from 'typesafe-actions';

export const sessionReseted = createAction('SESSION_RESETED')<void>();

export const encryptionKeyHashCreated = createAction(
  'ENCRYPTION_KEY_HASH_CREATED'
)<{
  encryptionKeyHash: string;
}>();
