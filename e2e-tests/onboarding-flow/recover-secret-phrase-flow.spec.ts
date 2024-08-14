import {
  DEFAULT_FIRST_ACCOUNT,
  DEFAULT_SECOND_ACCOUNT,
  RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS,
  RECOVER_SECOND_ACCOUNT_FROM_TWELVE_WORDS,
  twelveWordsSecretPhrase,
  twentyFourWordsSecretPhrase
} from '../constants';
import { onboarding, onboardingExpect } from '../fixtures';

onboarding.describe('Onboarding UI: recover secret phrase flow', () => {
  onboarding(
    'should recover one account via 24 words secret phrase',
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

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).toBeDisabled();

      await page.getByTestId('select-account-0').click();

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('All accounts').click();

      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey).nth(0)
      ).toBeVisible();
    }
  );

  onboarding(
    'should recover two accounts via 24 words secret phrase',
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

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).toBeDisabled();

      await page.getByTestId('select-account-0').click();
      await page.getByTestId('select-account-1').click();

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('All accounts').click();

      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey).nth(0)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_SECOND_ACCOUNT.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(DEFAULT_SECOND_ACCOUNT.truncatedPublicKey).nth(0)
      ).toBeVisible();
    }
  );
  onboarding(
    'should recover one account via 12 words secret phrase',
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

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).toBeDisabled();

      await page.getByTestId('select-account-0').click();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).not.toBeDisabled();

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('All accounts').click();

      await onboardingExpect(
        page.getByText(RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page
          .getByText(RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS.truncatedPublicKey)
          .nth(0)
      ).toBeVisible();
    }
  );
  onboarding(
    'should recover two accounts via 12 words secret phrase',
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

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).toBeDisabled();

      await page.getByTestId('select-account-0').click();
      await page.getByTestId('select-account-1').click();

      await onboardingExpect(
        page.getByRole('button', { name: 'Recover selected accounts' })
      ).not.toBeDisabled();

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('All accounts').click();

      await onboardingExpect(
        page.getByText(RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page
          .getByText(RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS.truncatedPublicKey)
          .nth(0)
      ).toBeVisible();
      await onboardingExpect(
        page.getByText(RECOVER_SECOND_ACCOUNT_FROM_TWELVE_WORDS.accountName)
      ).toBeVisible();
      await onboardingExpect(
        page
          .getByText(
            RECOVER_SECOND_ACCOUNT_FROM_TWELVE_WORDS.truncatedPublicKey
          )
          .nth(0)
      ).toBeVisible();
    }
  );
});
