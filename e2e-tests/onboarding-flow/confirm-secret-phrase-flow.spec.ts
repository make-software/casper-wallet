import { onboardingExpect, onboarding } from '../fixtures';
import { DEFAULT_FIRST_ACCOUNT } from '../constants';
import { createLocators } from '../constants';

onboarding.describe('Onboarding UI: confirm secret phrase flow', () => {
  onboarding(
    'should create a new vault when the user enters the correct secret phrase',
    async ({
      page,
      createOnboardingPassword,
      createSecretPhrase,
      copySecretPhrase,
      confirmSecretPhraseSuccess,
      extensionId
    }) => {
      await createOnboardingPassword();
      await createSecretPhrase();

      const phrase = await copySecretPhrase();

      await confirmSecretPhraseSuccess(phrase);

      await onboardingExpect(page).toHaveURL(/.*confirm-secret-phrase-success/);

      await page.getByRole('button', { name: 'Done' }).click();

      await onboardingExpect(page.getByText('Got it')).toBeVisible();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await onboardingExpect(
        page.getByText(DEFAULT_FIRST_ACCOUNT.accountName)
      ).toBeVisible();
      //Fresh account should have empty balances, no nft or deploy history
      await onboardingExpect(
        page.getByText("NFTs")).toBeVisible();

      await page.getByText("NFTs").click();

      await onboardingExpect(
      await page.getByText("No NFT tokens")).toBeVisible();

      await page.getByText("Deploys").click();

      await onboardingExpect(
      await page.getByText("No activity")).toBeVisible();

      const locators = createLocators(page);
      const accountSwitcher = locators.accountSwitcher;
      const firstAccount = locators.firstAccount;
    
      // Perform actions and assertions
      await accountSwitcher.click();
    }
  );

  onboarding(
    'should NOT create a vault when the user entered the wrong secret phrase',
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
