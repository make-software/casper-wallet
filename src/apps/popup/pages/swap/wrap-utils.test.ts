import { IDexToken } from 'casper-wallet-core/src/domain/swap';

import { getSwapFormMode } from './wrap-utils';

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
