import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountCreated } from '@src/background/redux/vault/actions';

export function initializeWalletWithPhrase(phrase: unknown) {
  // cleanup and disabling action handler
  disableOnboardingFlow();
  dispatchToMainStore(accountCreated());
}
