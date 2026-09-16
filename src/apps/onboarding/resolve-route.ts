export type OnboardingRoute = 'authorized' | 'reauth' | 'locked' | 'no-vault';

interface OnboardingRouteInput {
  keysDoesExist: boolean;
  encryptionKeyDoesExist: boolean;
  isLoggedIn: boolean;
}

/**
 * `reauth` and `locked` look alike and are not: the first is this tab's own session
 * being stale while the vault is open, the second is the vault itself being shut.
 * Onboarding may verify a password but is not allowed to unlock the vault, so only
 * `reauth` has a form that can succeed. Keys, not the session, prove a wallet exists.
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
