import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { secretPhraseCreated } from '@src/background/redux/vault/actions';
import { validateSecretPhrase } from '@src/libs/crypto';

export function initializeWalletWithPhrase(phrase: unknown) {
  // cleanup and disabling action handler
  disableOnboardingFlow();
  if (!validateSecretPhrase(phrase)) {
    throw Error('Invalid secret phrase.');
  }
  dispatchToMainStore(secretPhraseCreated(phrase));
}
