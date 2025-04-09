import { twentyFourWordsSecretPhrase } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: back up secret phrase', () => {
  popup(
    'should display a secret phrase after providing password and copy phrase',
    async ({ popupPage, unlockVault, providePassword }) => {
      await unlockVault();
      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Back up your secret recovery phrase').click();
      await providePassword();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Back up your secret recovery phrase'
        })
      ).toBeVisible();
      await popupPage
        .getByText('Click to reveal secret recovery phrase')
        .click();
      await popupPage.getByText('Copy secret recovery phrase').click();

      const clipboardText = await popupPage.evaluate(async () => {
        return await navigator.clipboard.readText();
      });

      popupExpect(clipboardText).toBe(twentyFourWordsSecretPhrase);

      await popupExpect(
        popupPage.getByText('Copied to clipboard')
      ).toBeVisible();
    }
  );

  popup(
    'should timeout after providing wrong password 5 times',
    async ({ popupPage, unlockVault, setWrongPasswordFiveTimes }) => {
      await unlockVault();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Back up your secret recovery phrase').click();

      await setWrongPasswordFiveTimes();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Please wait before the next attempt to unlock your wallet'
        })
      ).toBeVisible();
    }
  );
});
