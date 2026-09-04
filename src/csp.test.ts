import csp from './csp.json';

describe('csp.json', () => {
  it('allows the trade API on mainnet and testnet', () => {
    expect(csp.connectSrc).toContain('https://api.cspr.trade/');
    expect(csp.connectSrc).toContain('https://api.testnet.cspr.trade/');
  });

  it('keeps default-src locked down', () => {
    expect(csp.baseDirectives).toContain("default-src 'none'");
  });
});
