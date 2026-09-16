import {
  formatProtocolFeePercent,
  isHighPriceImpact,
  shouldStackSwapRoute
} from './swap-details-utils';

describe('isHighPriceImpact', () => {
  it('is false below the threshold', () => {
    expect(isHighPriceImpact('9.99')).toBe(false);
  });

  it('is false at the threshold', () => {
    expect(isHighPriceImpact('10')).toBe(false);
  });

  it('is true above the threshold', () => {
    expect(isHighPriceImpact('10.01')).toBe(true);
    expect(isHighPriceImpact('100.00')).toBe(true);
  });

  it('is false without a quote', () => {
    expect(isHighPriceImpact(null)).toBe(false);
  });
});

describe('formatProtocolFeePercent', () => {
  it('renders the shipped fee as a percentage', () => {
    expect(formatProtocolFeePercent(0.003)).toBe('0.3');
  });

  it('drops trailing zeros', () => {
    expect(formatProtocolFeePercent(0.01)).toBe('1');
  });
});

describe('shouldStackSwapRoute', () => {
  it('keeps a direct swap beside the label', () => {
    expect(shouldStackSwapRoute(2)).toBe(false);
  });

  it('stacks a routed swap under the label', () => {
    expect(shouldStackSwapRoute(3)).toBe(true);
  });

  it('stacks every longer route', () => {
    expect(shouldStackSwapRoute(4)).toBe(true);
  });

  it('keeps an empty or single-token route beside the label', () => {
    expect(shouldStackSwapRoute(0)).toBe(false);
    expect(shouldStackSwapRoute(1)).toBe(false);
  });
});
