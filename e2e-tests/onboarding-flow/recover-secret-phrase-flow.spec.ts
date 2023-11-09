import { onboardingExpect, onboarding } from '../fixtures';
import { recoverSecretPhrase } from '../common';

onboarding.describe('Onboarding UI: recover secret phrase flow', () => {
  onboarding(
    'should recover secret phrase',
    async ({ page, createOnboardingPassword, browser }) => {
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
    }
  );
});
