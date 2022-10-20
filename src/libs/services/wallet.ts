import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { parseSecretKeyString } from '../crypto';

export function initializeWallet() {
  // cleanup and disabling action handler
  disableOnboardingFlow();

  // temporary account creation, will be replaced by derivation logic
  const { publicKeyHex, secretKeyBase64 } = parseSecretKeyString(
    'MC4CAQAwBQYDK2VwBCIEIKu6biwimq52O4qzdyAp78RrIblNs6GXZdkcqr0+iLLj'
  );
  const account = {
    publicKey: publicKeyHex,
    secretKey: secretKeyBase64
  };
  return account;
}
