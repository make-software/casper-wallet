import type { CasperWalletProvider as CasperWalletProviderFactory } from './sdk';

// The project's jest config runs with `testEnvironment: 'node'` (no
// `jest-environment-jsdom` dependency is installed), so `window`/`document`
// don't exist as globals here. `sdk.ts` touches both at module-evaluation
// time (it assigns `window.CasperWalletProvider = ...` at the bottom of the
// file) and at call time (`window.dispatchEvent`, `document.title`), so the
// minimal stand-ins below must be in place *before* the module is required.
// A top-level `import` would run too early for that (module side effects
// execute at import time), so the module under test is `require`d lazily
// inside the test after the globals are set.
const loadSdk = (): {
  CasperWalletProvider: typeof CasperWalletProviderFactory;
} => {
  (global as { window?: unknown }).window = {
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  };
  (global as { document?: unknown }).document = { title: 'test dapp' };

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./sdk');
};

describe('CasperWalletProvider requestId', () => {
  it('generates unique, non-sequential request ids', () => {
    const { CasperWalletProvider } = loadSdk();

    const ids = new Set<string>();
    const spy = jest
      .spyOn(window, 'dispatchEvent')
      .mockImplementation(() => true);
    // A short timeout keeps the internal `setTimeout` (default 30 min) from
    // outliving the test as an open handle — the calls below are never
    // resolved/rejected by a real response, only by this timeout firing.
    const provider = CasperWalletProvider({ timeout: 1 });
    provider.requestConnection().catch(() => undefined);
    provider.requestConnection().catch(() => undefined);
    const events = spy.mock.calls.map(
      ([e]) => (e as CustomEvent).detail?.meta?.requestId
    );
    events.filter(Boolean).forEach(id => ids.add(id as string));
    expect(ids.size).toBe(2);
    ids.forEach(id => expect(id).toMatch(/[0-9a-f-]{36}/));
    spy.mockRestore();
  });
});
