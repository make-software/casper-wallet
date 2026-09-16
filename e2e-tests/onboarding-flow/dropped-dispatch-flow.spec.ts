import { twentyFourWordsSecretPhrase } from '../constants';
import { DISPATCH_FAILED, breakTransport } from '../error-surface';
import { onboarding, onboardingExpect } from '../fixtures';

// The onboarding half of the guards: each of these three writes is the sole
// source of what the screen does next, and the router catches none of them.
onboarding.describe('Onboarding UI: a dropped write is not silent', () => {
  onboarding(
    'should keep the password screen when initKeys is dropped',
    async ({ page, createOnboardingPassword }) => {
      await breakTransport(page, ['INIT_KEYS_SAGA']);

      await createOnboardingPassword();

      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(page).toHaveURL(/.*create-vault-password/);

      // The staying-put is `keysDoesExist`, not the guard. What the guard decides
      // is whether the button survives a write that never landed.
      await onboardingExpect(
        page.getByRole('button', { name: 'Create password' })
      ).toBeEnabled();
    }
  );

  onboarding(
    'should keep the confirmation screen when initVault is dropped',
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

      await breakTransport(page, ['INIT_VAULT_SAGA']);

      await confirmSecretPhraseSuccess(phrase);

      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(page).not.toHaveURL(
        /.*confirm-secret-phrase-success/
      );

      // The in-flight gate must let go on a false verdict, or the banner would
      // be pointing at a button that can never be pressed again.
      await onboardingExpect(
        page.getByRole('button', { name: 'Confirm' })
      ).toBeEnabled();
    }
  );

  onboarding(
    'should keep the onboarding tab open when recoverVault is dropped',
    async ({ page, createOnboardingPassword }) => {
      await createOnboardingPassword();

      await page
        .getByRole('button', {
          name: 'Import an existing secret recovery phrase'
        })
        .click();

      await page
        .getByPlaceholder('e.g. Bobcat Lemon Blanket…')
        .fill(twentyFourWordsSecretPhrase);

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await page.getByTestId('select-account-0').click();

      await breakTransport(page, ['RECOVER_VAULT_SAGA']);

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      // Pins that the banner reaches THIS tree; it cannot pin the close-gate —
      // `closeActiveTab` is inert under Playwright.
      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();
    }
  );
});
