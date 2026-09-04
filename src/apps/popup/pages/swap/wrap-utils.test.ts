import { IDexToken } from 'casper-wallet-core/src/domain/swap';

import { getSelectableTokens, getSwapFormMode } from './wrap-utils';

const WCSPR = 'wcspr-hash';
const cspr = { id: 'cspr' } as IDexToken;
const wcspr = { id: WCSPR } as IDexToken;
const other = { id: 'other' } as IDexToken;
const p = { wrappedCsprPackageHash: WCSPR };

describe('getSwapFormMode', () => {
  it('is wrap for CSPR -> WCSPR', () => {
    expect(getSwapFormMode({ ...p, first: cspr, second: wcspr })).toBe('wrap');
  });

  it('is unwrap for WCSPR -> CSPR', () => {
    expect(getSwapFormMode({ ...p, first: wcspr, second: cspr })).toBe(
      'unwrap'
    );
  });

  it('is swap for an ordinary pair', () => {
    expect(getSwapFormMode({ ...p, first: cspr, second: other })).toBe('swap');
    expect(getSwapFormMode({ ...p, first: other, second: wcspr })).toBe('swap');
  });

  it('is swap while a token is missing', () => {
    expect(getSwapFormMode({ ...p, first: cspr, second: null })).toBe('swap');
    expect(getSwapFormMode({ ...p, first: null, second: null })).toBe('swap');
  });
});

describe('getSelectableTokens', () => {
  const listed = [other, { id: 'another' } as IDexToken];
  const wcsprToken = wcspr;

  it('offers WCSPR when the opposite card holds native CSPR', () => {
    expect(
      getSelectableTokens({ tokens: listed, wcsprToken, oppositeToken: cspr })
    ).toEqual([wcsprToken, ...listed]);
  });

  it('keeps the listed tokens in API order behind it', () => {
    const rows = getSelectableTokens({
      tokens: listed,
      wcsprToken,
      oppositeToken: cspr
    });

    expect(rows?.slice(1)).toEqual(listed);
  });

  it('withholds WCSPR for an ordinary opposite token', () => {
    expect(
      getSelectableTokens({ tokens: listed, wcsprToken, oppositeToken: other })
    ).toBe(listed);
  });

  it('withholds WCSPR while the opposite card is empty', () => {
    expect(
      getSelectableTokens({ tokens: listed, wcsprToken, oppositeToken: null })
    ).toBe(listed);
  });

  it('passes a still-loading list through untouched', () => {
    expect(
      getSelectableTokens({
        tokens: undefined,
        wcsprToken,
        oppositeToken: cspr
      })
    ).toBeUndefined();
  });
});
