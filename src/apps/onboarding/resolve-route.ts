export type OnboardingRoute = 'authorized' | 'unlock' | 'no-vault';

interface OnboardingRouteInput {
  keysDoesExist: boolean;
  encryptionKeyDoesExist: boolean;
  isLoggedIn: boolean;
}

export function resolveOnboardingRoute({
  keysDoesExist,
  encryptionKeyDoesExist,
  isLoggedIn
}: OnboardingRouteInput): OnboardingRoute {
  // Keys are what prove a wallet exists; `encryptionKeyDoesExist` only says the
  // session is live. Gating the whole tree on both sent a locked vault to
  // WelcomePage, one unconfirmed click from `resetVault()`.
  if (keysDoesExist) {
    return encryptionKeyDoesExist && isLoggedIn ? 'authorized' : 'unlock';
  }

  return 'no-vault';
}
