import { createAction } from 'typesafe-actions';

export const sessionDestroyed = createAction('SESSION_DESTROYED')<void>();

export const encryptionKeyHashCreated = createAction(
  'ENCRYPTION_KEY_HASH_CREATED'
)<{
  encryptionKeyHash: string;
}>();
