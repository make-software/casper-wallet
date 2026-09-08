import { IDexToken } from 'casper-wallet-core';
import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';

import { NetworkSetting } from '@src/constants';

import { TokenType } from '@hooks/use-casper-token';

import {
  isSwapAvailable,
  isTokenSwappable,
  toSwapTokenId
} from '@libs/services/swap-service/utils';

const dexToken = (packageHash: string): IDexToken => ({
  id: packageHash,
  name: 'The Swappery',
  symbol: 'SWPR',
  icon: null,
  decimals: 18,
  packageHash,
  isWhitelisted: true,
  isBlacklisted: false,
  fiatRates: null,
  totalValueLocked: null,
  volume24h: null
});

const nativeCspr: TokenType = {
  id: 'Casper',
  contractPackageHash: undefined,
  name: 'Casper',
  amount: '1',
  amountFiat: null,
  symbol: 'CSPR',
  icon: null
};

const cep18 = (contractPackageHash?: string): TokenType => ({
  id: contractPackageHash ?? 'unknown',
  contractPackageHash,
  name: 'The Swappery',
  amount: '1',
  amountFiat: null,
  symbol: 'SWPR',
  icon: null
});

const HASH = '0d0f9c1b5a9e4d3c8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e';

describe('isSwapAvailable', () => {
  it('offers swap on Mainnet', () => {
    expect(isSwapAvailable(NetworkSetting.Mainnet, false)).toBe(true);
  });

  it('offers swap on Testnet', () => {
    expect(isSwapAvailable(NetworkSetting.Testnet, false)).toBe(true);
  });

  it('hides swap on Devnet, which has no trade API', () => {
    expect(isSwapAvailable(NetworkSetting.Devnet, false)).toBe(false);
  });

  it('hides swap on Integration, which has no trade API', () => {
    expect(isSwapAvailable(NetworkSetting.Integration, false)).toBe(false);
  });

  it('hides swap on the Safari build even on Mainnet', () => {
    expect(isSwapAvailable(NetworkSetting.Mainnet, true)).toBe(false);
  });

  it('hides swap on the Safari build on a network that has no trade API', () => {
    expect(isSwapAvailable(NetworkSetting.Devnet, true)).toBe(false);
  });
});

describe('isTokenSwappable', () => {
  it('treats native CSPR as tradeable without consulting the list', () => {
    expect(isTokenSwappable([], nativeCspr)).toBe(true);
  });

  it('accepts a CEP-18 token present in the list', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18(HASH))).toBe(true);
  });

  it('matches the contract package hash case-insensitively', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18(HASH.toUpperCase()))).toBe(
      true
    );
  });

  it('matches a wallet-side hash that carries the hash- prefix', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18(`hash-${HASH}`))).toBe(
      true
    );
  });

  it('matches a list hash that carries the hash- prefix', () => {
    expect(isTokenSwappable([dexToken(`hash-${HASH}`)], cep18(HASH))).toBe(
      true
    );
  });

  it('rejects a CEP-18 token absent from the list', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18('f'.repeat(64)))).toBe(
      false
    );
  });

  it('rejects any CEP-18 token when the list is empty', () => {
    expect(isTokenSwappable([], cep18(HASH))).toBe(false);
  });

  it('rejects a CEP-18 token that carries no contract package hash', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18(undefined))).toBe(false);
  });

  it('rejects a missing token', () => {
    expect(isTokenSwappable([dexToken(HASH)], null)).toBe(false);
  });
});

describe('toSwapTokenId', () => {
  it('reports a token with no package hash as the native CSPR id', () => {
    expect(toSwapTokenId()).toBe(CSPR_NATIVE_TOKEN_ID);
    expect(toSwapTokenId(undefined)).toBe(CSPR_NATIVE_TOKEN_ID);
  });

  it('lower-cases the package hash, so the unwrap deep link matches the core constant', () => {
    expect(toSwapTokenId(HASH.toUpperCase())).toBe(HASH);
  });

  it('strips the hash- prefix', () => {
    expect(toSwapTokenId(`hash-${HASH}`)).toBe(HASH);
    expect(toSwapTokenId(`HASH-${HASH.toUpperCase()}`)).toBe(HASH);
  });

  it('passes an already normalized hash through unchanged', () => {
    expect(toSwapTokenId(HASH)).toBe(HASH);
  });

  it('produces an id every token the Swap button is offered for can be found by', () => {
    expect(isTokenSwappable([dexToken(HASH)], cep18(`hash-${HASH}`))).toBe(
      true
    );
    expect(toSwapTokenId(`hash-${HASH}`)).toBe(dexToken(HASH).packageHash);
  });
});
