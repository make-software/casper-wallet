import {
  isHighSlippage,
  parseDeadlineInput,
  parseSlippageInput,
  sanitizeDecimalInput,
  sanitizeIntegerInput
} from './parse-settings-input';

describe('sanitizeDecimalInput', () => {
  it('passes a plain decimal through unchanged', () => {
    expect(sanitizeDecimalInput('1.5')).toBe('1.5');
  });

  it('converts a comma to a dot', () => {
    expect(sanitizeDecimalInput('1,5')).toBe('1.5');
  });

  it('strips letters', () => {
    expect(sanitizeDecimalInput('1a2b')).toBe('12');
  });

  it('drops a second dot', () => {
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
  });

  it('keeps a trailing dot while typing', () => {
    expect(sanitizeDecimalInput('1.')).toBe('1.');
  });

  it('strips a leading sign', () => {
    expect(sanitizeDecimalInput('-5')).toBe('5');
  });
});

describe('sanitizeIntegerInput', () => {
  it('strips non-digit characters', () => {
    expect(sanitizeIntegerInput('3o.5')).toBe('35');
  });
});

describe('parseSlippageInput', () => {
  it('parses a plain decimal', () => {
    expect(parseSlippageInput('1.5')).toBe(1.5);
  });

  it('truncates to 2 decimals without rounding up', () => {
    expect(parseSlippageInput('0.299')).toBe(0.29);
  });

  it('returns 0 for an empty string', () => {
    expect(parseSlippageInput('')).toBe(0);
  });

  it('returns 0 for a bare dot without throwing', () => {
    expect(parseSlippageInput('.')).toBe(0);
  });

  it('returns 0 for garbage input without throwing', () => {
    expect(parseSlippageInput('abc')).toBe(0);
  });

  it('parses a leading-dot decimal', () => {
    expect(parseSlippageInput('.5')).toBe(0.5);
  });
});

describe('parseDeadlineInput', () => {
  it('parses a whole number of minutes', () => {
    expect(parseDeadlineInput('45')).toBe(45);
  });

  it('returns 0 for an empty string', () => {
    expect(parseDeadlineInput('')).toBe(0);
  });
});

describe('isHighSlippage', () => {
  it('warns at the threshold', () => {
    expect(isHighSlippage('10')).toBe(true);
  });

  it('warns above the threshold', () => {
    expect(isHighSlippage('12.5')).toBe(true);
  });

  it('does not warn below the threshold', () => {
    expect(isHighSlippage('9.99')).toBe(false);
  });

  it('does not warn for an empty field', () => {
    expect(isHighSlippage('')).toBe(false);
  });
});
