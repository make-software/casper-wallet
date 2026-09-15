import {
  formatAmountForDisplay,
  sanitizeAmountInput
} from './amount-input-utils';

describe('sanitizeAmountInput', () => {
  it('promotes a leading dot', () => {
    expect(sanitizeAmountInput('.5', 9)).toBe('0.5');
  });

  it('strips commas', () => {
    expect(sanitizeAmountInput('1,234', 9)).toBe('1234');
  });

  it('keeps a trailing dot', () => {
    expect(sanitizeAmountInput('1234.', 9)).toBe('1234.');
  });

  it('accepts a fraction within the token decimals', () => {
    expect(sanitizeAmountInput('1.123456', 6)).toBe('1.123456');
  });

  it('rejects a fraction longer than the token decimals', () => {
    expect(sanitizeAmountInput('1.1234567', 6)).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(sanitizeAmountInput('abc', 9)).toBeNull();
    expect(sanitizeAmountInput('1.2.3', 9)).toBeNull();
  });

  it('accepts an empty value', () => {
    expect(sanitizeAmountInput('', 9)).toBe('');
  });
});

describe('formatAmountForDisplay', () => {
  it('adds separators to the integer part', () => {
    expect(formatAmountForDisplay('1234567')).toBe('1,234,567');
  });

  it('preserves an in-progress decimal tail', () => {
    expect(formatAmountForDisplay('1234.')).toBe('1,234.');
    expect(formatAmountForDisplay('1234.50')).toBe('1,234.50');
  });

  it('leaves an empty value alone', () => {
    expect(formatAmountForDisplay('')).toBe('');
  });
});

describe('formatAmountForDisplay with a display cap', () => {
  it('truncates a long fraction rather than rounding it', () => {
    expect(formatAmountForDisplay('155.713827512946367781', 5)).toBe(
      '155.71382'
    );
  });

  it('leaves a fraction shorter than the cap alone', () => {
    expect(formatAmountForDisplay('0.451857', 5)).toBe('0.45185');
    expect(formatAmountForDisplay('1.5', 5)).toBe('1.5');
  });

  it('keeps a trailing dot under the cap', () => {
    expect(formatAmountForDisplay('1234.', 5)).toBe('1,234.');
  });

  it('caps nothing when no cap is given', () => {
    expect(formatAmountForDisplay('155.713827512946367781')).toBe(
      '155.713827512946367781'
    );
  });
});
