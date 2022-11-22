import { SecretPhrase } from '@src/libs/crypto';
import { createAction } from 'typesafe-actions';

export const sessionDestroyed = createAction('SESSION_DESTROYED')<void>();

export const secretPhraseDecrypted = createAction(
  'SECRET_PHRASE_DECRYPTED'
)<SecretPhrase>();
