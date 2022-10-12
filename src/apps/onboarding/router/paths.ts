export enum RouterPath {
  Any = '*',
  Welcome = '/',
  CreateVaultPassword = '/create-vault-password',
  CreateSecretPhrase = '/create-secret-phrase',
  RecoverFromSecretPhrase = '/recover-from-secret-phrase',
  CreateSecretPhraseConfirmation = '/create-secret-phrase-confirmation',
  WriteDownSecretPhrase = '/write-down-secret-phrase',
  ConfirmSecretPhrase = '/confirm-secret-phrase',
  ConfirmSecretPhraseSuccess = '/confirm-secret-phrase-success',
  OnboardingSuccess = '/onboarding-success',
  OnboardingError = '/onboarding-error',
  ResetWallet = '/reset-wallet'
}
