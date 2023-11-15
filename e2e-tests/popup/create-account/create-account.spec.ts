import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../common';

popup.describe.skip('Popup UI: create account', () => {
  popup.beforeEach(async ({ unlockVault, popupPage }) => {
    await unlockVault(popupPage);
  });

  popup(
    'should create account from navigation menu',
    async ({ popupPage, createAccount }) => {
      await createAccount(ACCOUNT_NAMES.createdAccountName);

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.createdAccountName)
      ).toBeVisible();
    }
  );

  popup(
    'should create account from account list modal',
    async ({ popupPage }) => {
      await popupPage.getByTestId('connection-status-modal').click();

      await popupPage.getByRole('button', { name: 'Create' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Create account' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Account name', { exact: true })
        .fill(ACCOUNT_NAMES.createdAccountName);
      await popupPage.getByRole('button', { name: 'Create account' }).click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.createdAccountName)
      ).toBeVisible();
    }
  );
});
