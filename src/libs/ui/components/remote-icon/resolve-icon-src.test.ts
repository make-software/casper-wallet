import { DeployIcon } from '@src/constants';

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
        fallbackSrc: DeployIcon.Generic,
        hasError: true
      })
    ).toEqual({ src: DeployIcon.Generic, isFallback: true });
  });

  it('falls back when there is no url at all', () => {
    expect(
      resolveIconSrc({
        src: null,
        fallbackSrc: DeployIcon.Generic,
        hasError: false
      })
    ).toEqual({ src: DeployIcon.Generic, isFallback: true });

    expect(
      resolveIconSrc({
        src: '',
        fallbackSrc: DeployIcon.Generic,
        hasError: false
      })
    ).toEqual({ src: DeployIcon.Generic, isFallback: true });
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
        fallbackSrc: DeployIcon.Generic,
        hasError: true
      })
    ).toEqual({ src: DeployIcon.Generic, isFallback: true });
  });

  it('treats an empty-string fallback as no fallback', () => {
    expect(
      resolveIconSrc({
        src: 'https://example.com/a.svg',
        // Not a real DeployIcon value — this exercises the falsy-fallback
        // guard in resolveIconSrc itself, not a case that can occur through
        // the (now DeployIcon-typed) fallbackSrc prop in production.
        fallbackSrc: '' as DeployIcon,
        hasError: true
      })
    ).toBeNull();
  });
});
