import {
  getSafariCspContent,
  hasHttpPrefix,
  isBundledAssetPath
} from './utils';

// Splits a `directive value; directive value` policy string into a
// { directiveName: value } map. Tolerant of a trailing semicolon, repeated
// whitespace inside a directive, and a directive with no value.
const parseCspDirectives = (policy: string): Record<string, string> =>
  Object.fromEntries(
    policy
      .split(';')
      .map(directive => directive.trim())
      .filter(directive => directive.length > 0)
      .map(directive => {
        const [name, ...valueParts] = directive.split(/\s+/);

        return [name, valueParts.join(' ')];
      })
  );

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

describe('isBundledAssetPath', () => {
  it('accepts the two shapes bundled icons actually use', () => {
    expect(isBundledAssetPath('assets/icons/generic.svg')).toBe(true);
    expect(isBundledAssetPath('/assets/icons/casper.svg')).toBe(true);
    expect(isBundledAssetPath('assets/illustrations/rate-app.svg')).toBe(true);
  });

  it('rejects every remote scheme, including a shouted one', () => {
    expect(
      isBundledAssetPath('https://casper-assets.s3.amazonaws.com/a.svg')
    ).toBe(false);
    expect(isBundledAssetPath('http://example.com/a.svg')).toBe(false);
    // hasHttpPrefix is case-sensitive; this predicate must not inherit that gap,
    // because whatever it rejects is what stays out of react-inlinesvg.
    expect(isBundledAssetPath('HTTPS://example.com/a.svg')).toBe(false);
    expect(isBundledAssetPath('//example.com/a.svg')).toBe(false);
  });

  it('rejects the two shapes react-inlinesvg injects without any fetch', () => {
    expect(isBundledAssetPath('data:image/svg+xml,%3Csvg%3E%3C/svg%3E')).toBe(
      false
    );
    expect(
      isBundledAssetPath('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')
    ).toBe(false);
    expect(isBundledAssetPath('<svg onload="x"></svg>')).toBe(false);
  });

  it('rejects traversal and near-misses', () => {
    expect(isBundledAssetPath('')).toBe(false);
    expect(isBundledAssetPath('../assets/icons/a.svg')).toBe(false);
    expect(isBundledAssetPath('assets')).toBe(false);
    expect(isBundledAssetPath('myassets/icons/a.svg')).toBe(false);
    expect(isBundledAssetPath('  assets/icons/a.svg')).toBe(false);
  });

  // The prefix is the easy half. These all START with a legitimate `assets/`,
  // so a `^/?assets/` test accepts every one of them — and react-inlinesvg
  // inlines any string containing `<svg` verbatim, with no fetch and therefore
  // no connect-src gate, on the signing screens AccountInfoIcon renders in.
  it('rejects markup smuggled into the remainder of a valid prefix', () => {
    expect(isBundledAssetPath('assets/<svg onload=1></svg>')).toBe(false);
    expect(
      isBundledAssetPath('assets/x<svg><style>*{display:none}</style></svg>')
    ).toBe(false);
    expect(isBundledAssetPath('/assets/<svg/>')).toBe(false);
    expect(isBundledAssetPath('assets/data:image/svg+xml,<svg/>')).toBe(false);
    expect(isBundledAssetPath('assets/icons/a.svg?x=<svg>')).toBe(false);
    expect(isBundledAssetPath('assets/icons/a.svg#<svg>')).toBe(false);
    expect(isBundledAssetPath('assets/../../etc/passwd')).toBe(false);
  });

  // Guards the other direction: a rejected bundled path falls through to
  // RemoteIcon, which renders it as <img> and so loses SvgIcon's
  // fill="currentColor" pass — the icon still appears but stops following the
  // theme, which no other test would catch.
  it('stays permissive enough for asset shapes webpack may emit later', () => {
    expect(isBundledAssetPath('assets/icons/icon.min.svg')).toBe(true);
    expect(isBundledAssetPath('assets/images/logo.png')).toBe(true);
    expect(isBundledAssetPath('assets/icons/nested/deep/a.svg')).toBe(true);
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

  it('pins every directive by exact value, including the full connect-src host list', () => {
    // Parsed into a { directive: value } map and compared whole against
    // literals below. That closes two gaps `toContain` and a self-import
    // left open: `toContain("default-src 'none'")` still matches
    // "default-src 'none' https:", so widening a directive stayed green; and
    // a directive with no assertion at all (or a newly appended one) was
    // matched by nothing. A map diff catches a widened, narrowed, removed,
    // or newly appended directive alike.
    //
    // The connect-src host list is intentionally hand-written here rather
    // than read from `cspConfig.connectSrc` (src/csp.json) — comparing
    // csp.json against itself proves nothing about its contents, only that
    // getSafariCspContent() assembles the string getSafariCspContent()
    // assembles. src/csp.json now single-sources this list into the Chrome
    // manifest, the Firefox manifest, and this Safari <meta> tag, which is
    // exactly why pinning its actual contents (not its own echo) matters.
    //
    // Trade-off: every legitimate host addition or removal in src/csp.json
    // now also requires editing the literal below. That is the intended
    // effect, not an accident — it forces a host-list change through review
    // instead of silently widening (or breaking) all three CSP targets.
    const directives = parseCspDirectives(getSafariCspContent());

    expect(directives).toEqual({
      'default-src': "'none'",
      'object-src': "'none'",
      'base-uri': "'none'",
      'form-action': "'none'",
      'frame-ancestors': "'none'",
      'script-src': "'self' 'wasm-unsafe-eval'",
      'img-src': 'https: data:',
      'media-src': 'https: data:',
      'style-src': "'unsafe-inline'",
      'connect-src': [
        'https://event-store-api-clarity-testnet.make.services',
        'https://event-store-api-clarity-mainnet.make.services',
        'https://image-proxy-cdn.make.services/',
        'https://node.cspr.cloud/',
        'https://node.testnet.cspr.cloud/',
        'https://api.testnet.casperwallet.io/',
        'https://api.mainnet.casperwallet.io/',
        'https://onramp-api.cspr.click/api/',
        'https://cspr-wallet-api.dev.make.services/',
        'https://cspr-api-gateway.dev.make.services/cspr-node-proxy-rpc-dev-condor/',
        'https://cspr-wallet-api-condor.dev.make.services/',
        'https://cspr-wallet-api.stg.make.services/',
        'https://api.casperwallet.io/',
        'https://api.integration.casperwallet.io/',
        'https://node.integration.cspr.cloud/'
      ].join(' ')
    });
  });

  it('no longer reaches the casper-assets bucket', () => {
    expect(getSafariCspContent()).not.toContain('casper-assets');
  });
});
