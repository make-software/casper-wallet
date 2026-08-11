import { redactUrlQuery } from './redact-url-query';

describe('redactUrlQuery', () => {
  // The reason this function exists: a `signMessage` approval URL carries the
  // user's plaintext message as a search param, and a windows-API rejection can
  // quote the URL it failed on.
  it('drops everything from the first ? onward', () => {
    expect(
      redactUrlQuery(
        new Error(
          'Cannot create window: signature-request.html?message=SECRET&requestId=r8'
        )
      )
    ).toBe('Cannot create window: signature-request.html');
  });

  it('keeps a message that carries no query untouched', () => {
    expect(redactUrlQuery(new Error('no windows API'))).toBe('no windows API');
  });

  // A rejection value is not always an Error, and reading `.message` off a
  // string would log `undefined` instead of the cause.
  it('stringifies a non-Error rejection, still redacting its query', () => {
    expect(redactUrlQuery('failed on url.html?message=SECRET')).toBe(
      'failed on url.html'
    );
    expect(redactUrlQuery(undefined)).toBe('undefined');
  });

  // A browser error message is unbounded.
  it('truncates at 200 characters', () => {
    expect(redactUrlQuery(new Error('x'.repeat(500)))).toBe('x'.repeat(200));
  });
});
