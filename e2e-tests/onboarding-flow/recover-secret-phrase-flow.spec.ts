import { onboardingExpect, onboarding } from '../fixtures';
import { DEFAULT_FIRST_ACCOUNT, recoverSecretPhrase } from '../constants';

onboarding.describe('Onboarding UI: recover secret phrase flow', () => {
  onboarding(
    'should recover account via secret phrase',
    async ({ page, createOnboardingPassword, extensionId }) => {
      await createOnboardingPassword();

      await page
        .getByRole('button', {
          name: 'Import an existing secret recovery phrase'
        })
        .click();

      await onboardingExpect(
        page.getByText('Please enter your secret recovery phrase')
      ).toBeVisible();

      await page
        .getByPlaceholder('e.g. Bobcat Lemon Blanket…')
        .fill(recoverSecretPhrase);

      await page.getByRole('button', { name: 'Recover my wallet' }).click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey)
      ).toBeVisible();
    }
  );
});
