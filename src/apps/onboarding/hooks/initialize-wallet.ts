import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountCreated } from '@src/background/redux/vault/actions';
import { deriveKeyPair } from '../../../libs/crypto';

export function initializeWalletWithPhrase(phrase: unknown) {
  // cleanup and disabling action handler
  disableOnboardingFlow();

  const account = deriveKeyPair(phrase, 0);
  dispatchToMainStore(accountCreated(account));
}
