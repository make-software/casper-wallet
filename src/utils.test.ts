import fs from 'fs';
import path from 'path';

import { Browser } from '@src/constants';

import {
  NFTTokenStandard,
  coreNftStandardMap,
  getSafariCspContent,
  hasHttpPrefix,
  isBundledAssetPath,
  isValidPublicKey
} from './utils';

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
    // hasHttpPrefix is case-sensitive; this predicate must not inherit that gap.
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

  // These all START with a legitimate `assets/`, so a `^/?assets/` test accepts
  // every one — and react-inlinesvg inlines any string containing `<svg` verbatim.
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

  // The other direction: a rejected bundled path falls through to RemoteIcon's
  // <img>, losing the fill="currentColor" pass, so the icon stops following the theme.
  it('stays permissive enough for asset shapes webpack may emit later', () => {
    expect(isBundledAssetPath('assets/icons/icon.min.svg')).toBe(true);
    expect(isBundledAssetPath('assets/images/logo.png')).toBe(true);
    expect(isBundledAssetPath('assets/icons/nested/deep/a.svg')).toBe(true);
  });
});

describe('getSafariCspContent', () => {
  it('pins the script-src token set Safari enforces', () => {
    // Deliberate: Safari inherits 'wasm-unsafe-eval' from the shared
    // baseDirectives (libsodium compiles WebAssembly).
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
    // The connect-src hosts are hand-written rather than read from src/csp.json:
    // comparing that file against itself proves nothing.
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
      'style-src': "'self' 'unsafe-inline'",
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
        'https://node.integration.cspr.cloud/',
        'https://api.cspr.trade/',
        'https://api.testnet.cspr.trade/',
        'https://cspr-trade-api.dev.make.services/'
      ].join(' ')
    });
  });

  it('no longer reaches the casper-assets bucket', () => {
    expect(getSafariCspContent()).not.toContain('casper-assets');
  });
});

/**
 * The slice of the DOM `setCSPForSafari` touches, hand-built because jsdom is
 * not a dependency here. `querySelector` implements `[http-equiv]` for real, so
 * the early-out is decided by the stub head, not the test; anything else throws.
 */
interface StubElement {
  tagName: string;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
}

const createStubElement = (
  tagName: string,
  initialAttributes: Record<string, string> = {}
): StubElement => {
  const attributes = new Map(Object.entries(initialAttributes));

  return {
    tagName,
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    }
  };
};

const createStubDocument = (initialHeadChildren: StubElement[] = []) => {
  const head = {
    children: [...initialHeadChildren],
    appendChild(element: StubElement) {
      head.children.push(element);

      return element;
    }
  };

  return {
    head,
    createElement: (tagName: string) => createStubElement(tagName),
    getElementsByTagName: (tagName: string) =>
      tagName === 'head' ? [head] : [],
    querySelector: (selector: string) => {
      if (selector !== '[http-equiv]') {
        throw new Error(`stub document does not implement "${selector}"`);
      }

      return (
        head.children.find(child => child.getAttribute('http-equiv') != null) ??
        null
      );
    }
  };
};

// isSafariBuild is frozen at module load from process.env.BROWSER. Loaded once
// per flavour because re-evaluating this module re-evaluates casper-js-sdk.
const loadUtilsForBrowser = (browser: Browser): typeof import('./utils') => {
  const previousBrowser = process.env.BROWSER;

  process.env.BROWSER = browser;

  let loaded: typeof import('./utils') | undefined;

  jest.isolateModules(() => {
    // A static import would hoist above the env assignment above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('./utils');
  });

  if (previousBrowser === undefined) {
    delete process.env.BROWSER;
  } else {
    process.env.BROWSER = previousBrowser;
  }

  return loaded as typeof import('./utils');
};

describe('setCSPForSafari', () => {
  const safariUtils = loadUtilsForBrowser(Browser.Safari);
  const globalWithDocument = globalThis as { document?: unknown };

  const runAgainstDocument = (
    utils: typeof import('./utils'),
    stubDocument: ReturnType<typeof createStubDocument>
  ) => {
    const previousDocument = globalWithDocument.document;

    globalWithDocument.document = stubDocument;

    try {
      utils.setCSPForSafari();
    } finally {
      if (previousDocument === undefined) {
        delete globalWithDocument.document;
      } else {
        globalWithDocument.document = previousDocument;
      }
    }

    return stubDocument;
  };

  it('appends the policy meta to head on a Safari build', () => {
    const stubDocument = runAgainstDocument(safariUtils, createStubDocument());

    expect(stubDocument.head.children).toHaveLength(1);

    const [meta] = stubDocument.head.children;

    expect(meta.tagName).toBe('meta');
    expect(meta.getAttribute('http-equiv')).toBe('Content-Security-Policy');
    // Compared against the shared builder: what the policy should say is pinned
    // by the getSafariCspContent suite above.
    expect(meta.getAttribute('content')).toBe(
      safariUtils.getSafariCspContent()
    );
  });

  it('appends nothing a second time', () => {
    const stubDocument = createStubDocument();

    runAgainstDocument(safariUtils, stubDocument);
    runAgainstDocument(safariUtils, stubDocument);

    expect(stubDocument.head.children).toHaveLength(1);
  });

  // The guard is on `[http-equiv]`, not on the Content-Security-Policy one, so
  // ANY http-equiv meta in a page template suppresses Safari's only CSP.
  it('appends nothing when the document already carries any http-equiv meta', () => {
    const unrelatedMeta = createStubElement('meta', {
      'http-equiv': 'refresh',
      content: '30'
    });
    const stubDocument = runAgainstDocument(
      safariUtils,
      createStubDocument([unrelatedMeta])
    );

    expect(stubDocument.head.children).toEqual([unrelatedMeta]);
  });

  it.each([Browser.Chrome, Browser.Firefox, Browser.Edge])(
    'touches nothing on a %s build',
    browser => {
      const stubDocument = runAgainstDocument(
        loadUtilsForBrowser(browser),
        createStubDocument()
      );

      expect(stubDocument.head.children).toHaveLength(0);
    }
  );
});

// Gates every recipient address the user can type, so the boundaries of the
// accept set are pinned: a looser one sends funds to an unresolvable address.
describe('isValidPublicKey', () => {
  const ED25519 =
    '0125c4ffb9cc43f8211f9f5917f1eb941ccd0a8aec086154b046d4dbd290c476c5';
  const SECP256K1 =
    '0202d137fdf848673f12b8b50c8204cd5dee9bd39083deb22178e549cac3d882d429';

  it.each([
    ['an ED25519 key', ED25519],
    ['a SECP256K1 key', SECP256K1],
    ['an upper-case key', ED25519.toUpperCase()]
  ])('accepts %s', (_label, publicKey) => {
    expect(isValidPublicKey(publicKey)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['the empty string', ''],
    ['a non-hex character', ED25519.slice(0, -1) + 'z'],
    ['an unknown algorithm prefix', '03' + ED25519.slice(2)],
    ['an ED25519 key one character short', ED25519.slice(0, -1)],
    ['an ED25519 key one character long', ED25519 + 'a'],
    ['a SECP256K1 key at ED25519 length', SECP256K1.slice(0, 66)],
    ['the prefix alone', '01']
  ])('rejects %s', (_label, publicKey) => {
    expect(isValidPublicKey(publicKey)).toBe(false);
  });

  it('accepts a well-formed SECP256K1 key that is not on the curve', () => {
    // Matches casper-js-sdk: `PublicKey.fromHex` validates shape, not curve
    // membership.
    expect(isValidPublicKey('02' + '02' + '00'.repeat(32))).toBe(true);
  });
});

// setCSPForSafari only protects the documents that call it, one line in each
// app root. Entries come from disk so a sixth app is covered the day it lands.
describe('app entrypoints', () => {
  const appsDir = path.resolve(__dirname, 'apps');
  const apps = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(app => fs.existsSync(path.join(appsDir, app, 'index.tsx')));

  it('all five are discovered', () => {
    // A rename that left the scan above matching nothing would make the
    // assertions below a silent no-op.
    expect(apps.length).toBe(5);
  });

  it.each(apps)('src/apps/%s/index.tsx calls setCSPForSafari', app => {
    const source = fs.readFileSync(
      path.join(appsDir, app, 'index.tsx'),
      'utf8'
    );

    expect(source).toMatch(
      /import\s*\{[^}]*\bsetCSPForSafari\b[^}]*\}\s*from\s*'@src\/utils'/
    );
    expect(source).toMatch(/^\s*setCSPForSafari\(\);$/m);
  });
});

/** See `coreAuctionEntryPointMap` in constants.test.ts — same shape, same unchecked pairing. */
describe('coreNftStandardMap', () => {
  it.each([
    [NFTTokenStandard.CEP47, 'CEP47'],
    [NFTTokenStandard.CEP78, 'CEP78'],
    [NFTTokenStandard.CEP95, 'CEP95']
  ])('sends %s to core as %s', (standard, coreStandard) => {
    expect(coreNftStandardMap[standard]).toBe(coreStandard);
  });

  it('never sends two standards to the same core standard', () => {
    const coreStandards = Object.values(NFTTokenStandard).map(
      standard => coreNftStandardMap[standard]
    );

    expect(new Set(coreStandards).size).toBe(coreStandards.length);
  });
});
