import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../common';

popup.describe('Popup UI: create account', () => {
  popup(
    'should create account from navigation menu',
    async ({ page, createAccount, unlockVault }) => {
      await unlockVault();

      await createAccount(ACCOUNT_NAMES.createdAccountName);

      await popupExpect(
        page.getByText(ACCOUNT_NAMES.createdAccountName)
      ).toBeVisible();
    }
  );
  popup(
    'should create account from account list modal',
    async ({ page, unlockVault }) => {
      await unlockVault();

      await page.getByTestId('connection-status-modal').click();

      await page.getByRole('button', { name: 'Create' }).click();

      await popupExpect(
        page.getByRole('heading', { name: 'Create account' })
      ).toBeVisible();

      await page
        .getByPlaceholder('Account name', { exact: true })
        .fill(ACCOUNT_NAMES.createdAccountName);
      await page.getByRole('button', { name: 'Create account' }).click();

      await popupExpect(
        page.getByText(ACCOUNT_NAMES.createdAccountName)
      ).toBeVisible();
    }
  );
});
