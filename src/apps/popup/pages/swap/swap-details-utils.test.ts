import {
  formatProtocolFeePercent,
  isHighPriceImpact
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
