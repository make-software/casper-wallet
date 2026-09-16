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

  // A locked vault clears `encryptionKeyDoesExist` while the keys survive; routing that
  // to the no-vault tree puts WelcomePage in front of a wallet that exists.
  it('does not offer to create a wallet over a locked one', () => {
    expect(route({ keysDoesExist: true, isLoggedIn: true })).toBe('locked');
    expect(route({ keysDoesExist: true })).toBe('locked');
  });

  // The re-auth form only proves the password, and onboarding is not on the unlock
  // allowlist, so a locked vault routed there gets a form that cannot succeed.
  it('keeps a locked vault away from the re-auth form, logged in or not', () => {
    expect(route({ keysDoesExist: true, isLoggedIn: true })).not.toBe('reauth');
    expect(route({ keysDoesExist: true })).not.toBe('reauth');
  });
});
