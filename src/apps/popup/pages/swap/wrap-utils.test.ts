import { IDexToken } from 'casper-wallet-core/src/domain/swap';

import { ISwapTradeReview, IWrapTradeReview } from './types';
import {
  calculateWrapNetworkCost,
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
      detailsTitle: 'Swap details',
      successTitle: "You've swapped tokens"
    });
  });

  it('words every screen of a wrap', () => {
    expect(swapModeLabels.wrap).toEqual({
      formTitle: 'Wrap',
      confirmTitle: 'Confirm wrap',
      maxLabel: 'Wrap max',
      detailsTitle: 'Wrap details',
      successTitle: "You've wrapped CSPR"
    });
  });

  it('words every screen of an unwrap', () => {
    expect(swapModeLabels.unwrap).toEqual({
      formTitle: 'Unwrap',
      confirmTitle: 'Confirm unwrap',
      maxLabel: 'Unwrap max',
      detailsTitle: 'Unwrap details',
      successTitle: "You've unwrapped WCSPR"
    });
  });
});

describe('calculateWrapNetworkCost', () => {
  // Both DEX_PAYMENT_AMOUNT.wrap and .unwrap are 5 CSPR, so a rate of 0.1 makes either $0.50.
  it('converts the wrap payment to the given currency', () => {
    expect(calculateWrapNetworkCost('wrap', 0.1, 'USD')).toBe('$0.50');
  });

  it('converts the unwrap payment, which is charged separately from the wrap one', () => {
    expect(calculateWrapNetworkCost('unwrap', 0.1, 'USD')).toBe('$0.50');
  });

  it('falls back to the CSPR figure when no rate has loaded', () => {
    expect(calculateWrapNetworkCost('wrap', undefined, 'USD')).toBe('5 CSPR');
    expect(calculateWrapNetworkCost('wrap', null, 'USD')).toBe('5 CSPR');
  });

  // A rate of 0 is real market data, not a missing one, but it prices gas at nothing — the CSPR
  // figure is the honest thing to show rather than a confident "$0.00".
  it('falls back to the CSPR figure on a zero rate', () => {
    expect(calculateWrapNetworkCost('wrap', 0, 'USD')).toBe('5 CSPR');
  });

  it('honours a non-USD currency', () => {
    expect(calculateWrapNetworkCost('wrap', 0.1, 'EUR')).toBe('€0.50');
  });
});
