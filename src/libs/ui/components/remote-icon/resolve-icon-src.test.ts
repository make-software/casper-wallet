import { resolveIconSrc } from './resolve-icon-src';

describe('resolveIconSrc', () => {
  it('returns the remote url when it loads', () => {
    expect(
      resolveIconSrc({ src: 'https://example.com/a.svg', hasError: false })
    ).toEqual({ src: 'https://example.com/a.svg', isFallback: false });
  });

  it('falls back to the bundled asset when the remote url failed', () => {
    expect(
      resolveIconSrc({
        src: 'https://example.com/a.svg',
        fallbackSrc: 'assets/icons/generic.svg',
        hasError: true
      })
    ).toEqual({ src: 'assets/icons/generic.svg', isFallback: true });
  });

  it('falls back when there is no url at all', () => {
    expect(
      resolveIconSrc({
        src: null,
        fallbackSrc: 'assets/icons/generic.svg',
        hasError: false
      })
    ).toEqual({ src: 'assets/icons/generic.svg', isFallback: true });

    expect(
      resolveIconSrc({
        src: '',
        fallbackSrc: 'assets/icons/generic.svg',
        hasError: false
      })
    ).toEqual({ src: 'assets/icons/generic.svg', isFallback: true });
  });

  it('renders nothing when there is neither a url nor a fallback', () => {
    expect(resolveIconSrc({ src: undefined, hasError: false })).toBeNull();
    expect(
      resolveIconSrc({ src: 'https://example.com/a.svg', hasError: true })
    ).toBeNull();
  });

  it('falls back when both guard conditions overlap: hasError with a missing src', () => {
    expect(
      resolveIconSrc({
        src: null,
        fallbackSrc: 'assets/icons/generic.svg',
        hasError: true
      })
    ).toEqual({ src: 'assets/icons/generic.svg', isFallback: true });
  });

  it('treats an empty-string fallback as no fallback', () => {
    expect(
      resolveIconSrc({
        src: 'https://example.com/a.svg',
        fallbackSrc: '',
        hasError: true
      })
    ).toBeNull();
  });
});
