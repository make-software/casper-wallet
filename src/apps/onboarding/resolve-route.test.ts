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

  it('asks a session-stale tab to re-authenticate', () => {
    expect(route({ keysDoesExist: true, encryptionKeyDoesExist: true })).toBe(
      'reauth'
    );
  });

  // A locked vault clears `encryptionKeyDoesExist` (sessionReseted) while the
  // keys survive. Routing that to the no-vault tree puts WelcomePage — one
  // unconfirmed click from `resetVault()` — in front of a wallet that exists.
  // Reachable since the background arms the lockout on any increment: five wrong
  // passwords on an onboarding tab lock the vault.
  it('does not offer to create a wallet over a locked one', () => {
    expect(route({ keysDoesExist: true, isLoggedIn: true })).toBe('locked');
    expect(route({ keysDoesExist: true })).toBe('locked');
  });

  // The re-auth form only proves the password; it never emits
  // `encryptionKeyHashCreated`, and onboarding is not on the unlock allowlist.
  // Routing a locked vault there left a form that could not succeed.
  it('keeps a locked vault away from the re-auth form, logged in or not', () => {
    expect(route({ keysDoesExist: true, isLoggedIn: true })).not.toBe('reauth');
    expect(route({ keysDoesExist: true })).not.toBe('reauth');
  });
});
