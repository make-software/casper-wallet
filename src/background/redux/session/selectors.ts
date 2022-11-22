import { SecretPhrase } from '@src/libs/crypto';
import { RootState } from 'typesafe-actions';

export const selectSessionSecretPhrase = (
  state: RootState
): SecretPhrase | null => state.session.secretPhrase;
