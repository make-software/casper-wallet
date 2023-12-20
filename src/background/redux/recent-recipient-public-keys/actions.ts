import { createAction } from 'typesafe-actions';

export const recipientPublicKeyAdded = createAction(
  'RECIPIENT_PUBLIC_KEY_ADDED',
  (payload: string) => payload
)<string>();

export const recipientPublicKeyReseted = createAction(
  'RECIPIENT_PUBLIC_KEY_RESETED'
)();
