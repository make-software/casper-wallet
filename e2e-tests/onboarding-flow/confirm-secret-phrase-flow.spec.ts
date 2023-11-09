import { onboardingExpect, onboarding } from '../fixtures';

onboarding.describe('Onboarding UI: confirm secret phrase flow', () => {
  onboarding(
    'should confirm secret phrase flow when the user entered the correct secret phrase',
    async ({
      page,
      createOnboardingPassword,
      createSecretPhrase,
      copySecretPhrase,
      confirmSecretPhraseSuccess
    }) => {
      await createOnboardingPassword();
      await createSecretPhrase();

      const phrase = await copySecretPhrase();

      await confirmSecretPhraseSuccess(phrase);

      await onboardingExpect(page).toHaveURL(/.*confirm-secret-phrase-success/);

      await page.getByRole('button', { name: 'Done' }).click();

      await onboardingExpect(page.getByText('Got it')).toBeVisible();
    }
  );

  onboarding(
    'should NOT confirm secret phrase flow when the user entered the wrong secret phrase',
    async ({
      page,
      createOnboardingPassword,
      createSecretPhrase,
      copySecretPhrase,
      confirmSecretPhraseFailure
    }) => {
      await createOnboardingPassword();
      await createSecretPhrase();

      const phrase = await copySecretPhrase();

      await confirmSecretPhraseFailure(phrase);

      await onboardingExpect(page).toHaveURL(/.*error/);

      await page
        .getByRole('button', {
          name: 'Generate a new secret recovery phrase'
        })
        .click();

      await onboardingExpect(page).toHaveURL(
        /.*create-secret-phrase-confirmation/
      );
    }
  );
});
