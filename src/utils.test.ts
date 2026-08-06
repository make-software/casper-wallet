import cspConfig from './csp.json';
import { getSafariCspContent, hasHttpPrefix } from './utils';

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

describe('getSafariCspContent', () => {
  it('pins the script-src token set Safari enforces', () => {
    // Deliberate: Safari inherits 'wasm-unsafe-eval' from the shared
    // baseDirectives (libsodium compiles WebAssembly). Before the CSP was
    // single-sourced Safari had 'self' only, so this assertion is the record
    // of that change and the guard against the next silent one.
    const scriptSrcDirective = getSafariCspContent()
      .split('; ')
      .find(directive => directive.startsWith('script-src '));

    expect(scriptSrcDirective).toBe("script-src 'self' 'wasm-unsafe-eval'");
  });

  it('never grants eval or inline script', () => {
    expect(getSafariCspContent()).not.toContain("'unsafe-eval'");
    expect(getSafariCspContent()).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it('locks every fetch-directive default down', () => {
    const content = getSafariCspContent();

    expect(content).toContain("default-src 'none'");
    expect(content).toContain("object-src 'none'");
    expect(content).toContain("base-uri 'none'");
    expect(content).toContain("form-action 'none'");
  });

  it('carries every connect-src host from csp.json and nothing else', () => {
    const connectSrc = getSafariCspContent().split('connect-src ')[1];

    expect(connectSrc.split(' ')).toEqual(cspConfig.connectSrc);
  });

  it('no longer reaches the casper-assets bucket', () => {
    expect(getSafariCspContent()).not.toContain('casper-assets');
  });
});
