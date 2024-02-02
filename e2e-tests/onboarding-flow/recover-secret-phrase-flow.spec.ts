import {
  DEFAULT_FIRST_ACCOUNT,
  RECOVER_ACCOUNT_FROM_TWELVE_WORDS,
  twelveWordsSecretPhrase,
  twentyFourWordsSecretPhrase
} from '../constants';
import { onboarding, onboardingExpect } from '../fixtures';

onboarding.describe('Onboarding UI: recover secret phrase flow', () => {
  onboarding(
    'should recover account via 24 words secret phrase',
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
        .fill(twentyFourWordsSecretPhrase);

      await page.getByRole('button', { name: 'Recover my wallet' }).click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey).nth(0)
      ).toBeVisible();
    }
  );
  onboarding(
    'should recover account via 12 words secret phrase',
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
        .fill(twelveWordsSecretPhrase);

      await page.getByRole('button', { name: 'Recover my wallet' }).click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await onboardingExpect(
        page.getByText(RECOVER_ACCOUNT_FROM_TWELVE_WORDS.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page
          .getByText(RECOVER_ACCOUNT_FROM_TWELVE_WORDS.truncatedPublicKey)
          .nth(0)
      ).toBeVisible();
    }
  );
});
