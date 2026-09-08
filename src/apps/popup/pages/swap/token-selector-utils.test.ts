import { IDexToken } from 'casper-wallet-core/src/domain/swap';

import {
  filterDexTokens,
  getCustomTokenStatus,
  parseContractHashQuery
} from './token-selector-utils';

const HASH = 'a'.repeat(64);

describe('parseContractHashQuery', () => {
  it('accepts a bare 64-hex hash', () => {
    expect(parseContractHashQuery(HASH)).toBe(HASH);
  });

  it('strips the hash- prefix', () => {
    expect(parseContractHashQuery(`hash-${HASH}`)).toBe(HASH);
  });

  it('is case-insensitive', () => {
    expect(parseContractHashQuery(HASH.toUpperCase())).toBe(HASH.toUpperCase());
  });

  it('rejects anything else', () => {
    expect(parseContractHashQuery('shib')).toBeNull();
    expect(parseContractHashQuery('a'.repeat(63))).toBeNull();
    expect(parseContractHashQuery('')).toBeNull();
  });
});

describe('filterDexTokens', () => {
  const tokens = [
    { id: '1', symbol: 'SHIBOO', name: 'Shiboo Coin', packageHash: 'aa' },
    { id: '2', symbol: 'FATSO', name: 'Fatso', packageHash: 'bb' }
  ] as IDexToken[];

  it('returns every token for an empty query', () => {
    expect(filterDexTokens(tokens, '')).toHaveLength(2);
  });

  it('matches the symbol case-insensitively', () => {
    expect(filterDexTokens(tokens, 'shib')).toEqual([tokens[0]]);
  });

  it('matches the name', () => {
    expect(filterDexTokens(tokens, 'coin')).toEqual([tokens[0]]);
  });

  it('matches the package hash', () => {
    expect(filterDexTokens(tokens, 'bb')).toEqual([tokens[1]]);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterDexTokens(tokens, 'zzz')).toEqual([]);
  });
});

describe('getCustomTokenStatus', () => {
  const base = {
    token: undefined,
    isLoading: false,
    isError: false,
    status: undefined
  };

  it('is loading while the request is in flight', () => {
    expect(getCustomTokenStatus({ ...base, isLoading: true })).toBe('loading');
  });

  it('is not-found on 404', () => {
    expect(getCustomTokenStatus({ ...base, isError: true, status: 404 })).toBe(
      'not-found'
    );
  });

  it('is error on any other failure', () => {
    expect(getCustomTokenStatus({ ...base, isError: true, status: 500 })).toBe(
      'error'
    );
  });

  it('hides a blacklisted token behind not-found', () => {
    const token = { isWhitelisted: false, isBlacklisted: true } as IDexToken;
    expect(getCustomTokenStatus({ ...base, token })).toBe('not-found');
  });

  it('reports a whitelisted token', () => {
    const token = { isWhitelisted: true, isBlacklisted: false } as IDexToken;
    expect(getCustomTokenStatus({ ...base, token })).toBe('whitelisted');
  });

  it('reports an unlisted token', () => {
    const token = { isWhitelisted: false, isBlacklisted: false } as IDexToken;
    expect(getCustomTokenStatus({ ...base, token })).toBe('unlisted');
  });
});
