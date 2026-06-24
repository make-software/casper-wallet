import { formatPrimaryTypeLabel } from './formatters';

describe('formatPrimaryTypeLabel', () => {
  it('splits PascalCase into Title Case words', () => {
    expect(formatPrimaryTypeLabel('TransferWithAuthorization')).toBe(
      'Transfer With Authorization'
    );
  });
  it('leaves a single word capitalized', () => {
    expect(formatPrimaryTypeLabel('Permit')).toBe('Permit');
  });
  it('handles snake_case and kebab-case', () => {
    expect(formatPrimaryTypeLabel('transfer_with_authorization')).toBe(
      'Transfer With Authorization'
    );
    expect(formatPrimaryTypeLabel('transfer-with-authorization')).toBe(
      'Transfer With Authorization'
    );
  });
  it('returns empty string unchanged', () => {
    expect(formatPrimaryTypeLabel('')).toBe('');
  });
  it('returns empty string for separator-only input', () => {
    expect(formatPrimaryTypeLabel('_')).toBe('');
    expect(formatPrimaryTypeLabel('__')).toBe('');
    expect(formatPrimaryTypeLabel('-')).toBe('');
    expect(formatPrimaryTypeLabel('   ')).toBe('');
  });
});
