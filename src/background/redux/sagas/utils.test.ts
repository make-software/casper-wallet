import { errorToMessage } from './utils';

describe('errorToMessage', () => {
  it('returns the message of an Error instance', () => {
    expect(errorToMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies a plain object', () => {
    expect(errorToMessage({})).toBe('[object Object]');
  });

  it('stringifies a string as-is', () => {
    expect(errorToMessage('x')).toBe('x');
  });

  it('stringifies null', () => {
    expect(errorToMessage(null)).toBe('null');
  });
});
