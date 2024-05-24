import { deriveKeyPair } from '@libs/crypto';
import { KeyPair } from '@libs/types/account';

export interface KeyPairOptions {
  size: number;
  offset: number;
  secretPhrase: string[];
}

export const getKeyPairList = ({
  size,
  offset,
  secretPhrase
}: KeyPairOptions) => {
  const keyPairs: KeyPair[] = [];

  for (let i = 0; i < size; i++) {
    const keyPair = deriveKeyPair(secretPhrase, offset + i);

    keyPairs.push(keyPair);
  }

  return keyPairs;
};
