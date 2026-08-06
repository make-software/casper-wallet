import { hasHttpPrefix } from './utils';

describe('hasHttpPrefix', () => {
  it('accepts absolute http and https urls', () => {
    expect(hasHttpPrefix('https://casper-assets.s3.amazonaws.com/a.svg')).toBe(
      true
    );
    expect(hasHttpPrefix('http://example.com/a.svg')).toBe(true);
  });

  it('rejects bundled extension asset paths', () => {
    expect(hasHttpPrefix('assets/icons/generic.svg')).toBe(false);
    expect(hasHttpPrefix('/assets/icons/casper.svg')).toBe(false);
  });

  it('rejects the empty string', () => {
    expect(hasHttpPrefix('')).toBe(false);
  });

  it('rejects other schemes', () => {
    expect(hasHttpPrefix('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBe(
      false
    );
    expect(hasHttpPrefix('chrome-extension://abc/assets/icons/a.svg')).toBe(
      false
    );
    // eslint-disable-next-line no-script-url
    expect(hasHttpPrefix('javascript:alert(1)')).toBe(false);
  });

  it('is anchored at the start of the string', () => {
    expect(hasHttpPrefix('  https://example.com/a.svg')).toBe(false);
    expect(hasHttpPrefix('/redirect?to=https://example.com/a.svg')).toBe(false);
  });
});
