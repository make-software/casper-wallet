import { resolveOnboardingRoute } from './resolve-route';

const route = (over: Partial<Parameters<typeof resolveOnboardingRoute>[0]>) =>
  resolveOnboardingRoute({
    keysDoesExist: false,
    encryptionKeyDoesExist: false,
    isLoggedIn: false,
    ...over
  });

describe('resolveOnboardingRoute', () => {
  it('sends a fresh install to the no-vault routes', () => {
    expect(route({})).toBe('no-vault');
  });

  it('sends an unlocked, logged-in vault to the authorized routes', () => {
    expect(
      route({
        keysDoesExist: true,
        encryptionKeyDoesExist: true,
        isLoggedIn: true
      })
    ).toBe('authorized');
  });

  it('asks a session-stale tab to unlock', () => {
    expect(route({ keysDoesExist: true, encryptionKeyDoesExist: true })).toBe(
      'unlock'
    );
  });

  // A locked vault clears `encryptionKeyDoesExist` (sessionReseted) while the
  // keys survive. Routing that to the no-vault tree puts WelcomePage — one
  // unconfirmed click from `resetVault()` — in front of a wallet that exists.
  // Reachable since the background arms the lockout on any increment: five wrong
  // passwords on an onboarding tab lock the vault.
  it('asks a locked vault to unlock rather than offering to create one', () => {
    expect(route({ keysDoesExist: true, isLoggedIn: true })).toBe('unlock');
    expect(route({ keysDoesExist: true })).toBe('unlock');
  });
});
