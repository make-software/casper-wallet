import { createAction } from 'typesafe-actions';

export const sessionReseted = createAction('SESSION_RESETED')<void>();

export const encryptionKeyHashCreated = createAction(
  'ENCRYPTION_KEY_HASH_CREATED'
)<{
  encryptionKeyHash: string;
}>();

export const vaultUnlocked = createAction('VAULT_UNLOCKED', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const contactEditingPermissionChanged = createAction(
  'CONTACT_EDITING_PERMISSION_CHANGED'
)();
