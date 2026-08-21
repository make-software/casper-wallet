export type OnboardingRoute = 'authorized' | 'reauth' | 'locked' | 'no-vault';

interface OnboardingRouteInput {
  keysDoesExist: boolean;
  encryptionKeyDoesExist: boolean;
  isLoggedIn: boolean;
}

/**
 * `reauth` and `locked` look alike and are not: the first is this tab's own
 * session being stale while the vault is open, the second is the vault itself
 * being shut. Only the first has a form that can succeed — onboarding may verify
 * a password but is deliberately not allowed to unlock the vault, so a locked
 * vault gets a screen that says so rather than one that silently does nothing.
 *
 * Keys are what prove a wallet exists; `encryptionKeyDoesExist` only says the
 * session is live. Gating the whole tree on both sent a locked vault to
 * WelcomePage, one unconfirmed click from `resetVault()`.
 */
export function resolveOnboardingRoute({
  keysDoesExist,
  encryptionKeyDoesExist,
  isLoggedIn
}: OnboardingRouteInput): OnboardingRoute {
  if (!keysDoesExist) {
    return 'no-vault';
  }

  if (!encryptionKeyDoesExist) {
    return 'locked';
  }

  return isLoggedIn ? 'authorized' : 'reauth';
}
