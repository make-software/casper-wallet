import { SecretPhrase } from '@src/libs/crypto';

export interface SessionState {
  secretPhrase: SecretPhrase | null;
}
