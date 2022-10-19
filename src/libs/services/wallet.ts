import { parseSecretKeyFileContent } from '@src/apps/import-account-with-file/pages/import-account-with-file/hooks/import-secret-key';
import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';

export function initializeWallet() {
  // cleanup and disabling action handler
  disableOnboardingFlow();

  // temporary account creation, will be replaced by derivation logic
  const { publicKeyHex, secretKeyBase64 } = parseSecretKeyFileContent(
    'MC4CAQAwBQYDK2VwBCIEIKu6biwimq52O4qzdyAp78RrIblNs6GXZdkcqr0+iLLj'
  );
  const account = {
    publicKey: publicKeyHex,
    secretKey: secretKeyBase64
  };
  return account;
}
