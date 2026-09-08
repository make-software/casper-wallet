import { TradeApiUrl } from 'casper-wallet-core/src/domain/constants/casperNetwork';

import csp from './csp.json';
import manifestV2 from './manifest.v2.json';
import manifestV2Safari from './manifest.v2.safari.json';
import manifestV3 from './manifest.v3.json';

// The two networks cspr.trade serves; the other two entries of `TradeApiUrl` are empty strings.
const tradeHosts = [TradeApiUrl.mainnet, TradeApiUrl.testnet];

describe('csp.json', () => {
  // Derived from the constant core builds its requests from, not from literals: pinned
  // separately, a core bump can repoint one and leave the other with no visible symptom.
  it.each(tradeHosts)('allows the trade API host %s', host => {
    expect(csp.connectSrc.some(src => src.startsWith(host))).toBe(true);
  });

  it('keeps default-src locked down', () => {
    expect(csp.baseDirectives).toContain("default-src 'none'");
  });
});

describe('trade API host permissions', () => {
  // All three manifests, because the CSP allowance alone does not make the request: without a
  // host permission the quote is an ordinary cross-origin request subject to CORS.
  it.each(tradeHosts)('is granted on MV3 for %s', host => {
    expect(manifestV3.host_permissions).toContain(`${host}/*`);
  });

  it.each(tradeHosts)('is granted on MV2 for %s', host => {
    expect(manifestV2.permissions).toContain(`${host}/*`);
  });

  it.each(tradeHosts)('is granted on the Safari MV2 build for %s', host => {
    expect(manifestV2Safari.permissions).toContain(`${host}/*`);
  });
});
