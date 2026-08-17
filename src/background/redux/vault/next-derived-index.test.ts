import { findNextDerivedIndex } from '@background/redux/vault/next-derived-index';

import { deriveKeyPair } from '@libs/crypto';
import { FIXED_SECRET_PHRASE } from '@libs/crypto/__fixtures';
import { Account } from '@libs/types/account';

const derivedAccount = (index: number): Account => ({
  ...deriveKeyPair(FIXED_SECRET_PHRASE, index),
  name: `Account ${index + 1}`,
  hidden: false,
  derivationIndex: index
});

describe('findNextDerivedIndex', () => {
  it('is 0 for an empty vault', () => {
    expect(findNextDerivedIndex(FIXED_SECRET_PHRASE, [])).toBe(0);
  });

  it('skips the indexes already derived', () => {
    expect(
      findNextDerivedIndex(FIXED_SECRET_PHRASE, [
        derivedAccount(0),
        derivedAccount(1)
      ])
    ).toBe(2);
  });

  it('reuses a hole left by a removed account', () => {
    expect(
      findNextDerivedIndex(FIXED_SECRET_PHRASE, [
        derivedAccount(0),
        derivedAccount(2)
      ])
    ).toBe(1);
  });
});
