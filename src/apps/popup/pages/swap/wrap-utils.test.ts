import { IDexToken } from 'casper-wallet-core/src/domain/swap';

import { ISwapTradeReview, IWrapTradeReview } from './types';
import {
  getReviewMode,
  getSelectableTokens,
  getSwapFormMode,
  isUnwrapEntry,
  swapModeLabels
} from './wrap-utils';

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

describe('isUnwrapEntry', () => {
  it('recognises the wrapped-CSPR contract', () => {
    expect(isUnwrapEntry(WCSPR, WCSPR)).toBe(true);
  });

  it('ignores the native sentinel', () => {
    expect(isUnwrapEntry('cspr', WCSPR)).toBe(false);
  });

  it('ignores an ordinary token', () => {
    expect(isUnwrapEntry('some-other-hash', WCSPR)).toBe(false);
  });

  it('ignores a missing id', () => {
    expect(isUnwrapEntry(null, WCSPR)).toBe(false);
  });

  it('never matches on a network with no wrapped-CSPR deployment', () => {
    expect(isUnwrapEntry('', '')).toBe(false);
    expect(isUnwrapEntry(null, '')).toBe(false);
  });
});

describe('getReviewMode', () => {
  it('is swap for a traded pair', () => {
    expect(getReviewMode({ kind: 'swap' } as ISwapTradeReview)).toBe('swap');
  });

  it('follows the wrap arm’s own direction', () => {
    expect(
      getReviewMode({ kind: 'wrap', direction: 'wrap' } as IWrapTradeReview)
    ).toBe('wrap');
    expect(
      getReviewMode({ kind: 'wrap', direction: 'unwrap' } as IWrapTradeReview)
    ).toBe('unwrap');
  });
});

describe('swapModeLabels', () => {
  it('words every screen of a swap', () => {
    expect(swapModeLabels.swap).toEqual({
      formTitle: 'Swap',
      confirmTitle: 'Confirm swap',
      maxLabel: 'Swap max',
      successTitle: "You've swapped tokens"
    });
  });

  it('words every screen of a wrap', () => {
    expect(swapModeLabels.wrap).toEqual({
      formTitle: 'Wrap',
      confirmTitle: 'Confirm wrap',
      maxLabel: 'Wrap max',
      successTitle: "You've wrapped CSPR"
    });
  });

  it('words every screen of an unwrap', () => {
    expect(swapModeLabels.unwrap).toEqual({
      formTitle: 'Unwrap',
      confirmTitle: 'Confirm unwrap',
      maxLabel: 'Unwrap max',
      successTitle: "You've unwrapped WCSPR"
    });
  });
});
